// =========================================================================
// FICHIER : scrollytelling.js
// Gère l'initialisation des librairies, le pinning des figures, et les animations MapLibre.
// =========================================================================

// --- 1. INITIALISATION DES LIBRAIRIES ET CONTRÔLEUR ---
const controller = new ScrollMagic.Controller();
const figurePinCarte = document.getElementById('fig-carte-defenses');

// Variables pour l'état de la carte
let layersLoaded = false;
let mapInitialized = false;

// --- 2. INITIALISATION DE LA CARTE MAPLIBRE (Doit être en dehors de map.on('load')) ---
const mapContainer = document.getElementById('map-defenses');
const map = new maplibregl.Map({
    container: mapContainer,
    style: 'https://demotiles.maplibre.org/style.json', // Style de base
    center: [0, 0],
    zoom: 1,
    interactive: false 
});

map.on('load', () => {
    mapInitialized = true;
    console.log("Style de la carte MapLibre chargé. Début de la logique ScrollMagic.");
    
    // Une fois le style chargé, on peut démarrer la logique des scènes qui manipulent la carte.
    // L'appel loadGeoJsonLayers est dans le map.on('load') pour garantir la synchronisation.
    startMapScenes(); 
});


// =========================================================================
// SCÈNES HORS CARTE (Pinning du Tableau)
// =========================================================================

// SCÈNE 3/4 : Pinning du Tableau et Transition
const figurePinTableau = document.getElementById('fig-tableau-defenses');
const triggerTextTableau = document.querySelector('#defenses .content-block:nth-of-type(2)');
const triggerTextCarteStart = document.getElementById('map-start-trigger');


// Scène 3: Pinning du tableau
new ScrollMagic.Scene({
    triggerElement: triggerTextTableau, 
    triggerHook: 0,                   
    duration: triggerTextTableau.offsetHeight 
})
.setPin(figurePinTableau) 
// .addIndicators({name: "Tableau Pin"}) 
.addTo(controller);

// Scène 4: Fondu du tableau avant l'arrivée de la carte
const tableauOutTween = gsap.to(figurePinTableau, {opacity: 0, duration: 0.5, ease: "none"});

new ScrollMagic.Scene({
    triggerElement: triggerTextCarteStart, 
    triggerHook: 1,                   
    duration: "20%"                   
})
.setTween(tableauOutTween)
// .addIndicators({name: "Tableau Out"}) 
.addTo(controller);


// =========================================================================
// SCÈNES DE CARTE (EN GÉNÉRAL, ELLES DÉPENDENT DU map.on('load'))
// =========================================================================

/**
 * Définit et ajoute les sources GeoJSON et les couches à la carte.
 * Est appelée une seule fois au début des scènes de carte.
 */
function loadGeoJsonLayers() {
    if (layersLoaded || !mapInitialized) return; 

    // --- 7. LOGIQUE MAPLIBRE : CHARGEMENT DES COUCHES ---
    map.addSource('heights-data', {type: 'geojson', data: './geojson/heights_surfaces.geojson'});
    map.addSource('comm-data', {type: 'geojson', data: './geojson/comm_lines.geojson'});
    map.addSource('poi-data', {type: 'geojson', data: './geojson/POI_Area.geojson'});
    map.addSource('sectors-data', {type: 'geojson', data: './geojson/sectors.geojson'}); // NOUVEAU

    // --- Ajout des couches (toutes cachées ou avec un style minimal au départ) ---
    map.addLayer({
        id: 'poi-layer', type: 'fill', source: 'poi-data', layout: { 'visibility': 'none' }, 
        paint: {'fill-color': '#f89a9f', 'fill-opacity': 0.7, 'fill-outline-color': '#333'}
    });
    map.addLayer({
        id: 'heights-layer', type: 'fill', source: 'heights-data', layout: { 'visibility': 'none' },
        paint: {'fill-color': 'rgba(200, 200, 200, 0.5)', 'fill-outline-color': '#333'}
    });
    map.addLayer({
        id: 'sectors-layer', type: 'line', source: 'sectors-data', layout: { 'visibility': 'none' },
        paint: {'line-color': '#ff0000', 'line-width': 3, 'line-opacity': 0.8}
    });
    map.addLayer({
        id: 'comm-layer', type: 'line', source: 'comm-data', layout: { 'visibility': 'none' }, 
        paint: {'line-color': '#0080ff', 'line-width': 3, 'line-dasharray': [1, 2]}
    });

    layersLoaded = true;
    console.log("Couches GeoJSON définies et Secteurs chargés.");
}


/**
 * Démarre toutes les scènes ScrollMagic qui interagissent avec la carte.
 * EST APPELÉE DANS map.on('load').
 */
function startMapScenes() {
    
    // --- SCÈNE 6 : PINNING : CARTE MAPLIBRE GÉNÉRALE ---
    const mapPinStartTrigger = document.getElementById('map-start-trigger');
    const contentBlocks = document.querySelectorAll('#defenses .content-block');
    
    // Calcul de la Durée de Pinning : du bloc 3 au dernier bloc de la section Défenses
    let totalPinDuration = 0;
    // Commencer à partir de l'index 2 (le 3e bloc, qui est map-start-trigger) jusqu'à la fin
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


    // --- SCÈNE 8 : VUE GÉNÉRALE (Map Fly To 1) ---
    new ScrollMagic.Scene({
        triggerElement: mapPinStartTrigger, 
        triggerHook: 0.1, 
        duration: 0      
    })
    .on('enter', () => {
        // Fix des problèmes de rendu de la carte dans un conteneur sticky
        map.resize(); 
        
        // Chargement des données au premier déclenchement de la carte
        loadGeoJsonLayers();

        // Animation 1: Zoom initial sur la zone générale (Zoom 9)
        map.flyTo({
            center: [2.35, 48.86], // Coordonnées de la zone générale
            zoom: 9,
            essential: true 
        });
        console.log("Animation 1: flyTo vers la vue générale.");

        // Rendre les couches Défenses/POI/Hauteurs/Secteurs visibles pour le contexte général
        map.setLayoutProperty('poi-layer', 'visibility', 'visible');
        map.setLayoutProperty('heights-layer', 'visibility', 'visible');
        map.setLayoutProperty('sectors-layer', 'visibility', 'visible');
    })
    // .addIndicators({name: "Map FlyTo 1"}) 
    .addTo(controller);


    // --- SCÈNE 9 : ZOOM SUR SECTEUR 1 (Défenses) ---
    const triggerTextSecteur1 = document.getElementById('trigger-secteur-1');

    new ScrollMagic.Scene({
        triggerElement: triggerTextSecteur1,
        triggerHook: 0.5, // Déclenche quand le milieu du texte est atteint
        duration: 0
    })
    .on('enter', () => {
        // Animation 2: FlyTo vers le Secteur 1
        map.flyTo({
            center: [2.30, 48.90], // Coordonnées spécifiques du Secteur 1
            zoom: 14,              
            speed: 1.5,
            curve: 1,
            essential: true
        });
        console.log("Animation 2: flyTo vers Secteur 1 (Défenses).");

        // Mise à jour du filtre : n'afficher que le Secteur 1
        map.setFilter('sectors-layer', ['==', ['get', 'Name'], 'Secteur 1']);

        // S'assurer que les autres couches (comm) sont bien masquées
        map.setLayoutProperty('comm-layer', 'visibility', 'none');
    })
    // .addIndicators({name: "Zoom Secteur 1"})
    .addTo(controller);


    // --- SCÈNE 10 : ZOOM SUR SECTEUR 2 (Défenses) ---
    const triggerTextSecteur2 = document.getElementById('trigger-secteur-2');

    new ScrollMagic.Scene({
        triggerElement: triggerTextSecteur2,
        triggerHook: 0.5, 
        duration: 0
    })
    .on('enter', () => {
        // Animation 3: FlyTo vers le Secteur 2
        map.flyTo({
            center: [2.50, 48.70], // Coordonnées spécifiques du Secteur 2
            zoom: 14,
            speed: 1.5,
            curve: 1,
            essential: true
        });
        console.log("Animation 3: flyTo vers Secteur 2 (Défenses).");

        // Mise à jour du filtre : n'afficher que le Secteur 2
        map.setFilter('sectors-layer', ['==', ['get', 'Name'], 'Secteur 2']);
        
        // Optionnel: Changer l'opacité des POI pour mettre en évidence les POI du Secteur 2
        map.setPaintProperty('poi-layer', 'fill-opacity', 0.9);
    })
    // .addIndicators({name: "Zoom Secteur 2"})
    .addTo(controller);


    // --- SCÈNE 11 : TRANSITION DÉFENSES -> COMMUNICATION ---
    const endDefensesTrigger = document.getElementById('end-defenses-trigger');
    const figurePinSchema = document.getElementById('fig-schema-comm');

    // 1. Fondu de la Carte et Révélation du Schéma
    const transitionTween = gsap.timeline()
        // Faire disparaître la figure de la carte
        .to(figurePinCarte, {opacity: 0, duration: 0.5}, 0)
        // Révéler la figure du schéma
        .fromTo(figurePinSchema, {opacity: 0, y: 50}, {opacity: 1, y: 0, duration: 1}, 0.3);


    new ScrollMagic.Scene({
        triggerElement: endDefensesTrigger, 
        triggerHook: 0.1, // Déclenche un peu avant que le texte ne disparaisse
        duration: "50%"   // Durée de la transition
    })
    .setTween(transitionTween)
    // .addIndicators({name: "Transition D->C"})
    .addTo(controller);


    // --- SCÈNE 12 : PINNING DU SCHÉMA DE COMMUNICATION ---
    const triggerCommSchemaText = document.querySelector('#communication .content-block:nth-of-type(2)');
    
    // Pinning du schéma de communication pendant la lecture du texte descriptif
    new ScrollMagic.Scene({
        triggerElement: triggerCommSchemaText,
        triggerHook: 0,
        duration: triggerCommSchemaText.offsetHeight
    })
    .setPin(figurePinSchema)
    // .addIndicators({name: "Pin Schéma"})
    .addTo(controller);


    // *************************************************************
    // Les scènes suivantes (Comm - Scènes 13+) viendront après.
    // *************************************************************

} // Fin de startMapScenes() et map.on('load')
