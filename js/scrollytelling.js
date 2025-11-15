// ==========================================
// 1. INITIALISATION DES LIBRAIRIES
// ==========================================

// Initialise le contrôleur ScrollMagic
const controller = new ScrollMagic.Controller();
console.log("ScrollMagic Controller initialisé.");

// ==========================================
// 2. SCÈNE D'INTRODUCTION (Fondu de l'image)
// ==========================================

// Cible : Le bloc de texte 'Contexte et Mission'
const triggerElement = document.querySelector('#introduction .content-block');
// Figure à animer : l'image pleine écran
const targetElement = document.getElementById('fig-intro');

// Créer le Tween (l'animation réelle) avec GSAP
// On fait passer l'opacité de 1 à 0
const introTween = gsap.to(targetElement, {
    opacity: 0, 
    duration: 1, // Durée de l'animation GSAP (ici, 1 seconde)
    ease: "power1.inOut"
});

// Créer la Scène ScrollMagic
new ScrollMagic.Scene({
    triggerElement: triggerElement, // L'animation démarre quand ce bloc est visible
    triggerHook: 0.5,             // Démarre l'animation quand le milieu du bloc atteint le milieu de la fenêtre
    duration: "50%"               // L'animation dure pendant que l'utilisateur défile sur 50% de la hauteur de la fenêtre
})
.setTween(introTween) // Associer l'animation GSAP à la scène
// .addIndicators({name: "Intro Scene"}) // <--- DÉCOMMENTER POUR LE DEBUG
.addTo(controller);

// ==========================================
// 3. SCÈNE DE PINNING : TABLEAU DES DÉFENSES
// ==========================================

// Cible de Pinning : Le bloc Figure du tableau
const figurePinElement = document.getElementById('fig-tableau-defenses');
// Cible du Déclencheur : Le bloc de texte qui décrit le tableau
const triggerTextElement = document.querySelector('#defenses .content-block:nth-of-type(2)');

// Créer la Scène de Pinning
new ScrollMagic.Scene({
    triggerElement: triggerTextElement, // Déclencheur : le bloc de texte de description
    triggerHook: 0,                   // Démarre quand le haut du texte atteint le haut de la fenêtre (0)
    duration: triggerTextElement.offsetHeight // La durée est la hauteur exacte du bloc de texte
})
.setPin(figurePinElement) // Fixer l'élément figure
// .addIndicators({name: "Tableau Pin"}) // <--- DÉCOMMENTER POUR LE DEBUG
.addTo(controller);


// ==========================================
// 4. SCÈNE D'ANIMATION : TRANSITION TABLEAU -> CARTE
// ==========================================

// Nous voulons que le tableau s'efface (opacité 1 à 0) juste avant que la carte apparaisse.
const nextTriggerElement = document.querySelector('#defenses .content-block:nth-of-type(3)');

const tableauOutTween = gsap.to(figurePinElement, {
    opacity: 0, 
    duration: 0.5,
    ease: "none"
});

new ScrollMagic.Scene({
    triggerElement: nextTriggerElement, // L'animation démarre quand ce bloc est visible
    triggerHook: 1,                   // Démarre quand le bas du bloc de texte précédent atteint le bas de la fenêtre
    duration: "20%"                   // L'animation dure pendant que l'utilisateur défile sur 20% de la hauteur de la fenêtre
})
.setTween(tableauOutTween)
// .addIndicators({name: "Tableau Out"}) // <--- DÉCOMMENTER POUR LE DEBUG
.addTo(controller);


// ==========================================
// 5. INITIALISATION DE LA CARTE MAPLIBRE (à faire une seule fois)
// ==========================================

// Ceci est une initialisation de base. Elle doit être faite avant d'être animée.
// Remarque : Remplacez 'VOTRE_STYLE_URL' par un style MapLibre valide (Maptiler, OpenStreetMap, etc.)
const map = new maplibregl.Map({
    container: 'map-defenses', // ID du conteneur de carte HTML
    style: 'https://demotiles.maplibre.org/style.json', // URL de style
    center: [-74.006, 40.7128], // Coordonnées de départ (New York par défaut)
    zoom: 10,
    interactive: false // Très important : la carte n'est pas manipulable par l'utilisateur
});
console.log("Carte MapLibre initialisée (ID: map-defenses).");

// Ajoutez ici d'autres initialisations MapLibre (chargement des données GeoJSON, etc.)
