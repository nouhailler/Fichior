/**
 * Compiles a natural language search query into SQLite WHERE clauses.
 */
export function compileNaturalLanguageQuery(queryStr) {
  if (!queryStr || typeof queryStr !== 'string') {
    return { sql: '1=1', params: [] };
  }

  const query = queryStr.toLowerCase().trim();
  const clauses = [];
  const params = [];

  // Match sizes, e.g. "plus de 5 Mo", "> 5mb", "plus de 10 Ko"
  // Sizes can be in MB/Mo, GB/Go, KB/Ko
  const sizePlusRegex = /(?:plus de|>|larger than|greater than)\s*([\d.]+)\s*(mo|mb|go|gb|ko|kb)/i;
  const sizeMinusRegex = /(?:moins de|<|smaller than|less than)\s*([\d.]+)\s*(mo|mb|go|gb|ko|kb)/i;

  const getSizeBytes = (value, unit) => {
    const num = parseFloat(value);
    switch (unit.toLowerCase()) {
      case 'go':
      case 'gb':
        return num * 1024 * 1024 * 1024;
      case 'mo':
      case 'mb':
        return num * 1024 * 1024;
      case 'ko':
      case 'kb':
        return num * 1024;
      default:
        return num;
    }
  };

  const plusMatch = query.match(sizePlusRegex);
  if (plusMatch) {
    const bytes = getSizeBytes(plusMatch[1], plusMatch[2]);
    clauses.push('size > ?');
    params.push(bytes);
  }

  const minusMatch = query.match(sizeMinusRegex);
  if (minusMatch) {
    const bytes = getSizeBytes(minusMatch[1], minusMatch[2]);
    clauses.push('size < ?');
    params.push(bytes);
  }

  // Match file types
  // e.g. "pdf", "images", "photos", "musique", "videos", "code", "audio", "docx"
  if (/\bpdf\b/i.test(query)) {
    clauses.push("ext = '.pdf'");
  } else if (/\bdocx?\b/i.test(query)) {
    clauses.push("(ext = '.docx' OR ext = '.doc')");
  } else if (/\b(images?|photos?)\b/i.test(query)) {
    clauses.push("type LIKE 'image/%'");
  } else if (/\b(musiques?|audios?|sons?)\b/i.test(query)) {
    clauses.push("(type LIKE 'audio/%' OR ext IN ('.mp3', '.ogg', '.flac', '.wav', '.m4a'))");
  } else if (/\bvideos?\b/i.test(query)) {
    clauses.push("type LIKE 'video/%'");
  } else if (/\bcode\b/i.test(query)) {
    clauses.push("ext IN ('.js', '.jsx', '.ts', '.tsx', '.py', '.c', '.cpp', '.h', '.html', '.css', '.rs', '.go', '.java', '.php', '.sh')");
  }

  // Match time ranges
  // e.g. "semaine dernière" (last week), "hier" (yesterday), "mois dernier" (last month), "aujourd'hui" (today)
  const now = Date.now();
  if (/\b(semaine dernière|last week)\b/i.test(query)) {
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    clauses.push('mtime >= ?');
    params.push(oneWeekAgo);
  } else if (/\b(hier|yesterday)\b/i.test(query)) {
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    clauses.push('mtime >= ?');
    params.push(oneDayAgo);
  } else if (/\b(mois dernier|last month)\b/i.test(query)) {
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
    clauses.push('mtime >= ?');
    params.push(oneMonthAgo);
  } else if (/\b(aujourd'hui|today)\b/i.test(query)) {
    const startOfToday = new Date().setHours(0,0,0,0);
    clauses.push('mtime >= ?');
    params.push(startOfToday);
  }

  // Match years (e.g. "en 2025" or "en 2026")
  const yearMatch = query.match(/\ben (20\d{2})\b/i) || query.match(/\bin (20\d{2})\b/i);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    const startOfYear = new Date(year, 0, 1).getTime();
    const endOfYear = new Date(year + 1, 0, 1).getTime();
    clauses.push('mtime >= ? AND mtime < ?');
    params.push(startOfYear, endOfYear);
  }

  // EXIF / ID3 Metadata queries
  // Artist e.g. "artiste X" or "de l'artiste X"
  const artistMatch = query.match(/(?:artiste|artist|de l'artiste)\s+([a-zA-Z0-9_\-\s]+)/i);
  if (artistMatch) {
    const artist = artistMatch[1].trim();
    clauses.push("(metadata LIKE ? OR name LIKE ?)");
    params.push(`%"artist":"%${artist}%"%`, `%${artist}%`);
  }

  // Location/EXIF query e.g. "prises à paris" or "à paris" (location keyword in exif tag or filename)
  const locationMatch = query.match(/(?:prises à|prises a|à|a|in)\s+([a-zA-Z0-9_\-]+)/i);
  // Avoid matching triggers like size units or date keywords
  if (locationMatch && !['mo', 'mb', 'go', 'gb', 'ko', 'kb', 'hier', 'demain'].includes(locationMatch[1].toLowerCase())) {
    const location = locationMatch[1].trim();
    clauses.push("(metadata LIKE ? OR name LIKE ?)");
    params.push(`%${location}%`, `%${location}%`);
  }

  // Match tags e.g. "tag:urgent", "#urgent", "urgent"
  // Let's check hashtags
  const hashtags = query.match(/#([a-zA-Z0-9_\-]+)/g);
  if (hashtags) {
    for (const tag of hashtags) {
      const tagName = tag.substring(1);
      clauses.push(`path IN (
        SELECT file_path FROM file_tags ft
        JOIN tags t ON ft.tag_id = t.id
        WHERE t.name = ?
      )`);
      params.push(tagName);
    }
  }

  // Content indexing query or Fuzzy match: if query has normal text leftover, let's extract keywords that aren't stop words
  let cleanedQuery = query
    .replace(sizePlusRegex, '')
    .replace(sizeMinusRegex, '')
    .replace(/\bpdf\b/gi, '')
    .replace(/\bdocx?\b/gi, '')
    .replace(/\b(images?|photos?|musiques?|audios?|sons?|videos?|code)\b/gi, '')
    .replace(/\b(semaine dernière|last week|hier|yesterday|mois dernier|last month|aujourd'hui|today)\b/gi, '')
    .replace(/\ben 20\d{2}\b/gi, '')
    .replace(/\bin 20\d{2}\b/gi, '')
    .replace(/(?:artiste|artist|de l'artiste)\s+[a-zA-Z0-9_\-\s]+/gi, '')
    .replace(/(?:prises à|prises a|à|a|in)\s+[a-zA-Z0-9_\-]+/gi, '')
    .replace(/#([a-zA-Z0-9_\-]+)/g, '')
    .trim();

  // If there are words left, search them inside content, name, tags or notes
  if (cleanedQuery.length > 1) {
    const words = cleanedQuery.split(/\s+/).filter(w => w.length > 1);
    for (const word of words) {
      clauses.push(`(
        name LIKE ? OR
        content LIKE ? OR
        path IN (
          SELECT file_path FROM file_tags ft JOIN tags t ON ft.tag_id = t.id WHERE t.name LIKE ?
        ) OR
        path IN (
          SELECT file_path FROM notes WHERE content LIKE ?
        )
      )`);
      const wordLike = `%${word}%`;
      params.push(wordLike, wordLike, wordLike, wordLike);
    }
  }

  const sql = clauses.length > 0 ? clauses.join(' AND ') : '1=1';
  return { sql, params };
}
