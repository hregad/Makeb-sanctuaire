// ==========================================
// 1. INITIALISATION DES LIBRAIRIES
// (Mêmes que précédemment)
// ==========================================

const controller = new ScrollMagic.Controller();
console.log("ScrollMagic Controller initialisé.");

// ==========================================
// 2. SCÈNE D'INTRODUCTION (Fondu de l'image)
// (Mêmes que précédemment)
// ==========================================

const triggerElement = document.querySelector('#introduction .content-block');
const targetElement = document.getElementById('fig-intro');

const introTween = gsap.to(targetElement, {
    opacity: 0, 
    duration: 1, 
    ease: "power1.inOut"
});

new ScrollMagic.Scene({
    triggerElement: triggerElement, 
    triggerHook: 0.5,             
    duration: "50%"               
})
.setTween(introTween)
// .addIndicators({name: "Intro Scene"}) 
.addTo(controller);

// ==========================================
// 3. SCÈNE DE PINNING : TABLEAU DES DÉFENSES
// (Mêmes que précédemment)
// ==========================================

const figurePinTableau = document.getElementById('fig-tableau-defenses');
const triggerTextTableau = document.querySelector('#defenses .content-block:nth-of-type(2)');

new ScrollMagic.Scene({
    triggerElement: triggerTextTableau, 
    triggerHook: 0,                   
    duration: triggerTextTableau.offsetHeight 
})
.setPin(figurePinTableau) 
// .addIndicators({name: "Tableau Pin"}) 
.addTo(controller);


// ==========================================
// 4. SCÈNE D'ANIMATION : TRANSITION TABLEAU -> CARTE
// (Mêmes que précédemment)
// ==========================================

const nextTriggerElement = document.querySelector('#defenses .content-block:nth-of-type(3)');

const tableauOutTween = gsap.to(figurePinTableau, {
    opacity: 0, 
    duration: 0.5,
    ease: "none"
});

new ScrollMagic.Scene({
    triggerElement: nextTriggerElement, 
    triggerHook: 1,                   
    duration: "20%"                   
})
.setTween(tableauOutTween)
// .addIndicators({name: "Tableau Out"}) 
.addTo(controller);


// ==========================================
// 5. INITIALISATION DE LA CARTE MAPLIBRE
// ==========================================

// Le conteneur de la carte est maintenant dans une nouvelle figure
const mapContainer = document.getElementById('map-defenses');
const map = new maplibregl.Map({
    container: mapContainer, // ID du conteneur de carte HTML
    style: 'https://demotiles.maplibre.org/style.json', // Style de base
    center: [0, 0],         // Coordonnées initiales (seront écrasées par flyTo)
    zoom: 1,
    interactive: false 
});
console.log("Carte MapLibre initialisée (ID: map-defenses).");

// Variable pour suivre l'état des couches de la carte
let layersLoaded = false;


// ==========================================
// 6. PINNING : CARTE MAPLIBRE GÉNÉRALE
// ==========================================

const figurePinCarte = document.getElementById('fig-carte-defenses');
const mapPinStartTrigger = document.querySelector('#defenses .content-block:nth-of-type(3)');

// Calcul de la Durée de Pinning : 
// La carte doit rester fixe pour tous les blocs de contenu restants de la section #defenses.
let totalPinDuration = 0;
const contentBlocks = document.querySelectorAll('#defenses .content-block');
// On commence à partir du troisième bloc (index 2) car les deux premiers étaient pour le tableau
for (let i = 2; i < contentBlocks.length; i++) {
    totalPinDuration += contentBlocks[i].offsetHeight;
}

new ScrollMagic.Scene({
    triggerElement: mapPinStartTrigger, 
    triggerHook: 0,                   // Démarre quand le haut du bloc atteint le haut de la fenêtre
    duration: totalPinDuration        // Dure pour la hauteur cumulée des blocs de texte suivants
})
.setPin(figurePinCarte) 
// .addIndicators({name: "Carte Pin"}) 
.addTo(controller);


// ==========================================
// 7. LOGIQUE MAPLIBRE : CHARGEMENT & PREMIÈRE ANIMATION
// ==========================================

/**
 * Charge les sources GeoJSON et ajoute les couches correspondantes à la carte.
 */
function loadGeoJsonLayers() {
    if (layersLoaded || !map.isStyleLoaded()) return;

    // 1. Charger les sources de données
    map.addSource('heights-data', {
        type: 'geojson',
        data: './geojson/heights_surfaces.geojson' // Fichier surfaces de hauteurs
    });
    map.addSource('comm-data', {
        type: 'geojson',
        data: './geojson/comm_lines.geojson'     // Fichier lignes de communication
    });
    map.addSource('poi-data', {
        type: 'geojson',
        data: './geojson/POI_Area.geojson'       // Fichier surfaces POI
    });

    // 2. Ajouter les couches
    
    // Couche 'POI_Area' (Surfaces) - au fond
    map.addLayer({
        id: 'poi-layer',
        type: 'fill',
        source: 'poi-data',
        paint: {
            'fill-color': '#f89a9f', // Rose pastel pour les zones
            'fill-opacity': 0.7
        }
    });

    // Couche 'heights_surfaces' (Surfaces Hachurées)
    map.addLayer({
        id: 'heights-layer',
        type: 'fill',
        source: 'heights-data',
        paint: {
            // Un pattern de hachures serait idéal ici, mais pour la simplicité, 
            // utilisons une couleur unie avec une bordure.
            'fill-color': '#ccc', 
            'fill-opacity': 0.5,
            'fill-outline-color': '#333'
        }
    });

    // Couche 'comm_lines' (Lignes) - avec animation de tirets
    map.addLayer({
        id: 'comm-layer',
        type: 'line',
        source: 'comm-data',
        paint: {
            'line-color': '#0080ff', // Bleu vif pour les lignes de comm
            'line-width': 3,
            // 'line-dasharray' anime les lignes en donnant un effet de mouvement
            'line-dasharray': [1, 2] 
        }
    });

    // Marquer les couches comme chargées
    layersLoaded = true;
    console.log("Couches GeoJSON chargées et ajoutées.");
}


// Dès que la carte MapLibre est prête, ajoutez les couches et configurez les animations
map.on('load', () => {
    // La logique de chargement des couches sera appelée ici
    // Note: On ne l'appelle pas ici directement, on la configure juste après.

    // 8. SCÈNE D'ANIMATION : MAP FLY TO (Première vue)
    // Cette scène déclenche le 'flyTo' et rend les couches visibles.
    new ScrollMagic.Scene({
        triggerElement: mapPinStartTrigger, 
        triggerHook: 0.1, // Déclenche un peu après le pinning
        duration: 0      // Animation instantanée (un "saut" de vue)
    })
    .on('enter', () => {
        // S'assurer que les couches sont chargées au moment du premier 'flyTo'
        if (!layersLoaded) {
             // Charger les couches au moment où le défilement l'exige
            loadGeoJsonLayers();
        }

        // 1. Animer la carte vers la première zone (Zone A - vue générale des défenses)
        map.flyTo({
            center: [2.35, 48.86], // Exemple : sur Paris
            zoom: 11,
            pitch: 0,
            bearing: 0,
            essential: true // Rend cette animation essentielle pour l'utilisateur
        });
        console.log("Animation 1: flyTo vers la vue générale.");

        // Rendre les couches chargées invisibles pour l'instant (on les animera plus tard si besoin)
        // Pour cette première vue générale, on va les rendre visibles pour montrer le contexte.
        map.setLayoutProperty('heights-layer', 'visibility', 'visible');
        map.setLayoutProperty('comm-layer', 'visibility', 'visible');
        map.setLayoutProperty('poi-layer', 'visibility', 'visible');
    })
    // .addIndicators({name: "Map FlyTo 1"}) 
    .addTo(controller);
});
