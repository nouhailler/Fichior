import React, { useState } from 'react';

const STEPS = [
  {
    title: '👋 Bienvenue sur Fichior !',
    content: 'Fichior est votre nouveau gestionnaire de fichiers intelligent. Laissez-nous vous guider rapidement à travers ses fonctionnalités les plus puissantes pour commencer à travailler efficacement.',
    image: '📁'
  },
  {
    title: '⚡ Recherche Plein Texte & Langage Naturel',
    content: 'Fini le temps où vous deviez parcourir des dizaines de dossiers. Tapez simplement "PDF de plus de 5 Mo" ou "images modifiées hier" dans la barre de recherche. Fichior traduit automatiquement cela en filtres précis.',
    image: '🔍'
  },
  {
    title: '⏳ Historique de Versions & Sécurité',
    content: "Fichior veille sur vos documents. Chaque fois que vous modifiez ou remplacez un fichier, l'application conserve automatiquement une copie des 3 dernières versions. Vous pouvez les restaurer à tout moment depuis l'Inspecteur de droite.",
    image: '⏳'
  },
  {
    title: '🤖 Watchdog : Tri automatique',
    content: "Automatisez vos tâches répétitives. Configurez des règles Watchdog pour déplacer automatiquement des types de fichiers (ex: déplacer tous les .pdf arrivant dans Téléchargements vers Documents) et leur ajouter des tags à la volée.",
    image: '🤖'
  },
  {
    title: '🛒 Panier Staging & Traitements en lot',
    content: 'Sélectionnez des fichiers situés dans différents dossiers, ajoutez-les au Panier (Staging Area), puis déplacez, copiez ou compressez le tout en une seule action collective !',
    image: '🛒'
  }
];

export default function OnboardingModal({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('fichior_onboarded', 'true');
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = STEPS[currentStep];

  return (
    <div className="modal-overlay" style={{ zIndex: 4000 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px', padding: '35px', textAlign: 'center' }}>
        <div style={{ fontSize: '72px', marginBottom: '20px' }}>{step.image}</div>
        <h2 style={{ marginTop: 0, marginBottom: '15px' }}>{step.title}</h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '15px', minHeight: '80px', margin: '0 0 25px 0' }}>
          {step.content}
        </p>

        {/* Indicator dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '30px' }}>
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: currentStep === idx ? 'var(--accent)' : 'var(--border-color)',
                transition: 'background-color 0.2s'
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            className="btn"
            style={{ visibility: currentStep === 0 ? 'hidden' : 'visible' }}
            onClick={handlePrev}
          >
            Précédent
          </button>
          
          <button className="btn" onClick={() => { localStorage.setItem('fichior_onboarded', 'true'); onClose(); }}>
            Passer le guide
          </button>

          <button className="btn btn-primary" onClick={handleNext}>
            {currentStep === STEPS.length - 1 ? 'Commencer !' : 'Suivant'}
          </button>
        </div>
      </div>
    </div>
  );
}
