// =========================================================================
// FICHIER : scrollytelling.js (VERSION INTÉGRALE AVEC FITBOUNDS)
// =========================================================================

// --- 1. INITIALISATION DES LIBRAIRIES ET CONTRÔLEUR ---
const controller = new ScrollMagic.Controller();
const figurePinCarte = document.getElementById('fig-carte-defenses');

let layersLoaded = false;
let mapInitialized = false;

// Bbox par défaut si les données GeoJSON ne sont pas prêtes (à ajuster à la taille de votre zone)
const DEFAULT_BBOX = [2.0, 48.0, 3.0, 49.5]; // Exemple: Une zone autour de Paris

// --- 2. INITIALISATION DE LA CARTE MAPLIBRE ---
const mapContainer = document.getElementById('map-defenses');
const map = new maplibregl.Map({
    container: mapContainer,
    style: 'https://demotiles.maplibre.org/style.json', // RETOUR AU FOND PAR DÉFAUT
    center: [2.5, 48.75],
    zoom: 8,
    interactive: false 
});

map.on('load', () => {
    mapInitialized = true;
    console.log("Style de la carte MapLibre chargé. Début de la logique ScrollMagic.");
    startMapScenes(); 
});


// =========================================================================
// FONCTIONS UTILITAIRES POUR LE CADRAGE (FITBOUNDS)
// =========================================================================

/**
 * Calcule la bbox d'un ensemble de features (nécessaire pour Map.fitBounds).
 * Fonction simplifiée : nécessite l'intégration d'un outil comme turf.js pour une gestion robuste des bbox complexes.
 */
function calculateBounds(features) {
    if (!features || features.length === 0) return DEFAULT_BBOX;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const feature of features) {
        // MapLibre a une fonction intégrée pour obtenir le bbox du GeoJSON
        const bbox = maplibregl.LngLatBounds.convert(feature.geometry.bbox || feature.bbox || maplibregl.geojson.geojsonExtent(feature));
        
        if (bbox) {
            minX = Math.min(minX, bbox._sw.lng);
            minY = Math.min(minY, bbox._sw.lat);
            maxX = Math.max(maxX, bbox._ne.lng);
            maxY = Math.max(maxY, bbox._ne.lat);
        }
    }
    return [minX, minY, maxX, maxY];
}

/**
 * Récupère les limites d'un ou plusieurs secteurs par leur nom pour le fitBounds.
 */
function getFeatureBounds(sourceId, name = null) {
    // Tente de récupérer les features. Peut échouer si la source n'est pas encore entièrement traitée.
    const features = map.querySourceFeatures(sourceId, {
        filter: name ? ['==', ['get', 'Name'], name] : undefined
    });

    if (features && features.length > 0) {
        return calculateBounds(features);
    }
    // Si les features ne sont pas prêtes, retourne la bbox par défaut pour éviter un crash.
    return DEFAULT_BBOX;
}


// =========================================================================
// SCÈNES DE CARTE (EN GÉNÉRAL, ELLES DÉPENDENT DU map.on('load'))
// =========================================================================

function loadGeoJsonLayers() {
    // ... (Logique de chargement GeoJSON identique, voir l'itération précédente) ...
    if (layersLoaded || !mapInitialized) return; 

    map.addSource('heights-data', {type: 'geojson', data: './geojson/heights_surfaces.geojson'});
    map.addSource('comm-data', {type: 'geojson', data: './geojson/comm_lines.geojson'});
    map.addSource('poi-data', {type: 'geojson', data: './geojson/POI_Area.geojson'});
    map.addSource('sectors-data', {type: 'geojson', data: './geojson/sectors.geojson'});

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


function startMapScenes() {
    // SCÈNE 6 : PINNING : CARTE MAPLIBRE GÉNÉRALE (Code Pinning inchangé)
    const mapPinStartTrigger = document.getElementById('map-start-trigger');
    const contentBlocks = document.querySelectorAll('#defenses .content-block');
    let totalPinDuration = 0;
    for (let i = 2; i < contentBlocks.length; i++) {
        totalPinDuration += contentBlocks[i].offsetHeight;
    }

    new ScrollMagic.Scene({
        triggerElement: mapPinStartTrigger, 
        triggerHook: 0,                   
        duration: totalPinDuration        
    })
    .setPin(figurePinCarte) 
    .addTo(controller);


    // --- SCÈNE 8 : VUE GÉNÉRALE (CADRÉE SUR LES HAUTEURS) ---
    new ScrollMagic.Scene({
        triggerElement: mapPinStartTrigger, 
        triggerHook: 0.1, 
        duration: 0      
    })
    .on('enter', () => {
        map.resize(); 
        loadGeoJsonLayers();

        // ** ACTION CLÉ : CADRAGE SUR LA COUCHE DES HAUTEURS **
        const bounds = getFeatureBounds('heights-data'); 
        map.fitBounds(bounds, {
            padding: 50, // Marge autour des données
            essential: true 
        });
        console.log("Animation 1: fitBounds sur les Hauteurs (Vue Générale).");

        map.setLayoutProperty('poi-layer', 'visibility', 'visible');
        map.setLayoutProperty('heights-layer', 'visibility', 'visible');
        map.setLayoutProperty('sectors-layer', 'visibility', 'visible');
    })
    .addTo(controller);


    // --- SCÈNE 9 : ZOOM SUR SECTEUR 1 ---
    const triggerTextSecteur1 = document.getElementById('trigger-secteur-1');

    new ScrollMagic.Scene({
        triggerElement: triggerTextSecteur1,
        triggerHook: 0.5, 
        duration: 0
    })
    .on('enter', () => {
        // ** ACTION CLÉ : CADRAGE SUR LE SECTEUR 1 **
        const bounds = getFeatureBounds('sectors-data', 'Secteur 1');
        map.fitBounds(bounds, {
            padding: 50,
            essential: true 
        });
        console.log("Animation 2: fitBounds sur Secteur 1.");

        map.setFilter('sectors-layer', ['==', ['get', 'Name'], 'Secteur 1']);
        map.setLayoutProperty('comm-layer', 'visibility', 'none');
    })
    .addTo(controller);


    // --- SCÈNE 10 : ZOOM SUR SECTEUR 2 ---
    const triggerTextSecteur2 = document.getElementById('trigger-secteur-2');

    new ScrollMagic.Scene({
        triggerElement: triggerTextSecteur2,
        triggerHook: 0.5, 
        duration: 0
    })
    .on('enter', () => {
        // ** ACTION CLÉ : CADRAGE SUR LE SECTEUR 2 **
        const bounds = getFeatureBounds('sectors-data', 'Secteur 2');
        map.fitBounds(bounds, {
            padding: 50,
            essential: true 
        });
        console.log("Animation 3: fitBounds sur Secteur 2.");

        map.setFilter('sectors-layer', ['==', ['get', 'Name'], 'Secteur 2']);
        map.setPaintProperty('poi-layer', 'fill-opacity', 0.9);
    })
    .addTo(controller);


    // --- SCÈNE 11 : TRANSITION DÉFENSES -> COMMUNICATION (Pinning Schéma à venir) ---
    const endDefensesTrigger = document.getElementById('end-defenses-trigger');
    const figurePinSchema = document.getElementById('fig-schema-comm');

    const transitionTween = gsap.timeline()
        .to(figurePinCarte, {opacity: 0, duration: 0.5}, 0)
        .fromTo(figurePinSchema, {opacity: 0, y: 50}, {opacity: 1, y: 0, duration: 1}, 0.3);


    new ScrollMagic.Scene({
        triggerElement: endDefensesTrigger, 
        triggerHook: 0.1, 
        duration: "50%"   
    })
    .setTween(transitionTween)
    .addTo(controller);


    // --- SCÈNE 12 : PINNING DU SCHÉMA DE COMMUNICATION (Pinning à venir) ---
    const triggerCommSchemaText = document.querySelector('#communication .content-block:nth-of-type(2)');
    
    new ScrollMagic.Scene({
        triggerElement: triggerCommSchemaText,
        triggerHook: 0,
        duration: triggerCommSchemaText.offsetHeight
    })
    .setPin(figurePinSchema)
    .addTo(controller);

} // Fin de startMapScenes()
