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


// ... (Les sections 1 à 4 restent inchangées)

// ==========================================
// 5. INITIALISATION DE LA CARTE MAPLIBRE
// ==========================================

const mapContainer = document.getElementById('map-defenses');
const figurePinCarte = document.getElementById('fig-carte-defenses');

const map = new maplibregl.Map({
    container: mapContainer,
    style: 'https://demotiles.maplibre.org/style.json', // Style de base
    center: [0, 0],
    zoom: 1,
    interactive: false 
});
console.log("Carte MapLibre initialisée (ID: map-defenses).");

let layersLoaded = false;
let mapInitialized = false;

// Une fois que la carte a chargé son style initial, on peut définir le drapeau
map.on('load', () => {
    mapInitialized = true;
    console.log("Style de la carte MapLibre chargé.");
});


// ==========================================
// 7. LOGIQUE MAPLIBRE : CHARGEMENT DES COUCHES (Maintenant une fonction séparée)
// ==========================================

/**
 * Charge les sources GeoJSON et ajoute les couches correspondantes à la carte.
 * Est appelée une seule fois lors du premier déclenchement de ScrollMagic.
 */
function loadGeoJsonLayers() {
    if (layersLoaded || !mapInitialized) return; // Ne rien faire si déjà chargé ou si le style n'est pas prêt

    // 1. Charger les sources de données
    map.addSource('heights-data', {
        type: 'geojson',
        data: './geojson/heights_surfaces.geojson' 
    });
    map.addSource('comm-data', {
        type: 'geojson',
        data: './geojson/comm_lines.geojson'     
    });
    map.addSource('poi-data', {
        type: 'geojson',
        data: './geojson/POI_Area.geojson'       
    });

    // 2. Ajouter les couches (Initialement cachées, sauf indication)
    
    // Couche 'POI_Area'
    map.addLayer({
        id: 'poi-layer',
        type: 'fill',
        source: 'poi-data',
        layout: { 'visibility': 'none' }, // Cachée au départ
        paint: {
            'fill-color': '#f89a9f', 
            'fill-opacity': 0.7,
            'fill-outline-color': '#333'
        }
    });

    // Couche 'heights_surfaces'
    map.addLayer({
        id: 'heights-layer',
        type: 'fill',
        source: 'heights-data',
        layout: { 'visibility': 'none' }, // Cachée au départ
        paint: {
            'fill-color': '#ccc', 
            'fill-opacity': 0.5,
            'fill-outline-color': '#333'
        }
    });

    // Couche 'comm_lines'
    map.addLayer({
        id: 'comm-layer',
        type: 'line',
        source: 'comm-data',
        layout: { 'visibility': 'none' }, // Cachée au départ
        paint: {
            'line-color': '#0080ff', 
            'line-width': 3,
            'line-dasharray': [1, 2] 
        }
    });

    layersLoaded = true;
    console.log("Couches GeoJSON définies dans MapLibre.");
}


// ==========================================
// 6. PINNING : CARTE MAPLIBRE GÉNÉRALE
// ==========================================

const mapPinStartTrigger = document.querySelector('#defenses .content-block:nth-of-type(3)');

// Calcul de la Durée de Pinning (reste le même)
let totalPinDuration = 0;
const contentBlocks = document.querySelectorAll('#defenses .content-block');
for (let i = 2; i < contentBlocks.length; i++) {
    totalPinDuration += contentBlocks[i].offsetHeight;
}

new ScrollMagic.Scene({
    triggerElement: mapPinStartTrigger, 
    triggerHook: 0,                   
    duration: totalPinDuration        
})
.setPin(figurePinCarte) 
// .addIndicators({name: "Carte Pin"}) 
.addTo(controller);


// ==========================================
// 8. SCÈNE D'ANIMATION 1 : MAP FLY TO (Première vue)
// ==========================================

new ScrollMagic.Scene({
    triggerElement: mapPinStartTrigger, 
    triggerHook: 0.1, // Déclenche juste après le début du pinning
    duration: 0      // Instant
})
.on('enter', () => {
    // 1. Assurer la taille et le chargement des données
    map.resize(); 
    loadGeoJsonLayers();
    
    // 2. Animer la carte vers la vue générale
    map.flyTo({
        center: [2.35, 48.86], // Exemple : Coordonnées de la zone générale
        zoom: 9,
        essential: true 
    });
    console.log("Animation 1: flyTo vers la vue générale.");

    // 3. Rendre les couches Défenses/POI visibles pour la vue générale
    map.setLayoutProperty('poi-layer', 'visibility', 'visible');
    map.setLayoutProperty('heights-layer', 'visibility', 'visible');
})
// .addIndicators({name: "Map FlyTo 1"}) 
.addTo(controller);

// ... (Les prochaines scènes d'animation viendront ici)
