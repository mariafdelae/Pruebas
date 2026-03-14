// ============================================
// RADIOACTIVE HARVEST - Game Engine
// ============================================

// ---- DATOS DEL JUEGO ----

const PLANTS = {
    atomico_verde: {
        name: "Atomico Verde",
        icon: "🌿",
        stages: ["🌱", "🌿", "☘️", "🍀"],
        growthDays: 4,
        basePrice: 50,
        waterNeed: 2,     // cuantas veces necesita agua por ciclo
        radiationBoost: 1.5,
        maxRadiation: 60,
        seedCost: 30,
        description: "Planta basica mutante. Resistente."
    },
    plutonio_rojo: {
        name: "Plutonio Rojo",
        icon: "🌺",
        stages: ["🌱", "🌾", "🌻", "🌺"],
        growthDays: 6,
        basePrice: 120,
        waterNeed: 3,
        radiationBoost: 2.0,
        maxRadiation: 80,
        seedCost: 75,
        description: "Flor mutante de alto poder."
    },
    uranio_azul: {
        name: "Uranio Azul",
        icon: "💎",
        stages: ["🌱", "🪴", "🌲", "💎"],
        growthDays: 8,
        basePrice: 250,
        waterNeed: 4,
        radiationBoost: 3.0,
        maxRadiation: 100,
        seedCost: 150,
        description: "Cristal radioactivo. Muy valioso."
    },
    cesio_dorado: {
        name: "Cesio Dorado",
        icon: "⭐",
        stages: ["🌱", "✨", "🌟", "⭐"],
        growthDays: 10,
        basePrice: 500,
        waterNeed: 5,
        radiationBoost: 4.0,
        maxRadiation: 100,
        seedCost: 300,
        description: "Estrella nuclear. La mas poderosa."
    },
    torio_purpura: {
        name: "Torio Purpura",
        icon: "🔮",
        stages: ["🌱", "🍇", "🟣", "🔮"],
        growthDays: 7,
        basePrice: 180,
        waterNeed: 3,
        radiationBoost: 2.5,
        maxRadiation: 90,
        seedCost: 100,
        description: "Orbe toxico. Equilibrio perfecto."
    }
};

const SHOP_ITEMS = {
    agua: { name: "Agua Pesada", icon: "💧", price: 10, type: "supply", description: "Riega una planta" },
    mutagen: { name: "Mutageno-X", icon: "☢️", price: 40, type: "supply", description: "+20 radiacion" },
    fertilizer: { name: "Fertilizante N", icon: "🧪", price: 25, type: "supply", description: "Crece 1 dia mas rapido" },
    shield: { name: "Escudo Anti-Plagas", icon: "🛡️", price: 60, type: "supply", description: "Protege por 3 dias" },
    seed_atomico: { name: "Semilla Atomico", icon: "🌿", price: 30, type: "seed", plantType: "atomico_verde" },
    seed_plutonio: { name: "Semilla Plutonio", icon: "🌺", price: 75, type: "seed", plantType: "plutonio_rojo" },
    seed_uranio: { name: "Semilla Uranio", icon: "💎", price: 150, type: "seed", plantType: "uranio_azul", unlockLevel: 3 },
    seed_cesio: { name: "Semilla Cesio", icon: "⭐", price: 300, type: "seed", plantType: "cesio_dorado", unlockLevel: 5 },
    seed_torio: { name: "Semilla Torio", icon: "🔮", price: 100, type: "seed", plantType: "torio_purpura", unlockLevel: 2 }
};

const EVENTS = [
    { name: "Lluvia Acida", type: "good", msg: "☔ Lluvia acida! Todas las plantas reciben agua gratis.", effect: "rain" },
    { name: "Fuga Radioactiva", type: "good", msg: "☢️ Fuga en reactor cercano! +15 radiacion a todos.", effect: "radiation_boost" },
    { name: "Plaga Mutante", type: "bad", msg: "🐛 Plaga mutante! Plantas sin escudo pierden salud.", effect: "plague" },
    { name: "Inspeccion Militar", type: "good", msg: "🎖️ Inspeccion militar! Bonus de reputacion.", effect: "reputation" },
    { name: "Tormenta Solar", type: "bad", msg: "🌞 Tormenta solar! Algunas plantas pierden radiacion.", effect: "solar_storm" },
    { name: "Mercado Negro", type: "good", msg: "🕵️ Contacto del mercado negro! Precios x2 hoy.", effect: "price_boost" },
    { name: "Terremoto", type: "bad", msg: "💥 Terremoto! Algunas parcelas se dañan.", effect: "earthquake" },
    { name: "Dia Tranquilo", type: "neutral", msg: "😌 Un dia tranquilo en la granja...", effect: "none" }
];

const CONTRACT_TEMPLATES = [
    { name: "Defensa Basica", plantType: "atomico_verde", qty: 3, minRadiation: 30, reward: 300, repBonus: 1 },
    { name: "Operacion Roja", plantType: "plutonio_rojo", qty: 2, minRadiation: 50, reward: 500, repBonus: 2 },
    { name: "Proyecto Azul", plantType: "uranio_azul", qty: 2, minRadiation: 60, reward: 800, repBonus: 3 },
    { name: "Estrella Nuclear", plantType: "cesio_dorado", qty: 1, minRadiation: 70, reward: 1200, repBonus: 4 },
    { name: "Suministro Mixto", plantType: null, qty: 5, minRadiation: 40, reward: 600, repBonus: 2 },
    { name: "Arsenal Purpura", plantType: "torio_purpura", qty: 3, minRadiation: 55, reward: 700, repBonus: 2 },
    { name: "Cargamento Urgente", plantType: null, qty: 8, minRadiation: 20, reward: 450, repBonus: 1 },
    { name: "Arma Definitiva", plantType: "cesio_dorado", qty: 3, minRadiation: 85, reward: 3000, repBonus: 5 }
];

// ---- ESTADO DEL JUEGO ----

let game = {
    money: 500,
    day: 1,
    level: 1,
    reputation: 0,
    maxReputation: 50,
    plots: [],
    gridSize: { cols: 4, rows: 3 },
    inventory: {},
    harvested: [],       // plantas cosechadas listas para vender
    contracts: [],
    activeContract: null,
    selectedPlot: null,
    selectedAction: null,
    priceMultiplier: 1,
    totalEarnings: 0,
    totalHarvests: 0,
    totalContractsCompleted: 0,
    eventToday: null
};

// ---- INICIALIZACION ----

function initGame() {
    game = {
        money: 500,
        day: 1,
        level: 1,
        reputation: 0,
        maxReputation: 50,
        plots: [],
        gridSize: { cols: 4, rows: 3 },
        inventory: { agua: 5 },
        harvested: [],
        contracts: [],
        activeContract: null,
        selectedPlot: null,
        selectedAction: null,
        priceMultiplier: 1,
        totalEarnings: 0,
        totalHarvests: 0,
        totalContractsCompleted: 0,
        eventToday: null
    };

    // Crear parcelas
    const totalPlots = game.gridSize.cols * game.gridSize.rows;
    for (let i = 0; i < totalPlots; i++) {
        game.plots.push(createEmptyPlot());
    }

    generateContracts();
    renderAll();
    logMsg("Bienvenido a RADIOACTIVE HARVEST!", "success");
    logMsg("Compra semillas, planta y cultiva para la guerra.", "info");
    logMsg("Usa ☢ MUTAR para aumentar el poder de tus plantas.", "info");
}

function createEmptyPlot() {
    return {
        plant: null,
        plantType: null,
        stage: 0,
        dayPlanted: 0,
        water: 0,
        radiation: 0,
        health: 100,
        shieldDays: 0,
        ready: false,
        damaged: false
    };
}

// ---- ACCIONES DEL JUGADOR ----

function buyItem(itemId) {
    const item = SHOP_ITEMS[itemId];
    if (!item) return;

    if (item.unlockLevel && game.level < item.unlockLevel) {
        logMsg(`Necesitas nivel ${item.unlockLevel} para comprar ${item.name}.`, "warning");
        return;
    }

    if (game.money < item.price) {
        logMsg("No tienes suficiente dinero!", "danger");
        return;
    }

    game.money -= item.price;

    if (item.type === "seed") {
        // Buscar parcela seleccionada o primera vacia
        let targetPlot = null;
        if (game.selectedPlot !== null && !game.plots[game.selectedPlot].plant) {
            targetPlot = game.selectedPlot;
        } else {
            targetPlot = game.plots.findIndex(p => !p.plant);
        }

        if (targetPlot === -1 || targetPlot === null || (targetPlot !== null && game.plots[targetPlot] && game.plots[targetPlot].plant)) {
            // No hay parcela, guardar como semilla en inventario
            const invKey = "seed_" + item.plantType;
            game.inventory[invKey] = (game.inventory[invKey] || 0) + 1;
            logMsg(`${item.icon} Semilla guardada en inventario.`, "info");
        } else {
            plantSeed(targetPlot, item.plantType);
        }
    } else {
        game.inventory[itemId] = (game.inventory[itemId] || 0) + 1;
        logMsg(`Compraste ${item.icon} ${item.name}.`, "info");
    }

    renderAll();
}

function plantSeed(plotIndex, plantType) {
    const plot = game.plots[plotIndex];
    const plant = PLANTS[plantType];

    plot.plant = plantType;
    plot.plantType = plantType;
    plot.stage = 0;
    plot.dayPlanted = game.day;
    plot.water = 0;
    plot.radiation = 0;
    plot.health = 100;
    plot.ready = false;
    plot.damaged = false;

    logMsg(`${plant.icon} Plantaste ${plant.name} en parcela ${plotIndex + 1}.`, "success");
}

function plantFromInventory(plotIndex) {
    // Find available seed in inventory
    const seedKeys = Object.keys(game.inventory).filter(k => k.startsWith("seed_") && game.inventory[k] > 0);
    if (seedKeys.length === 0) {
        logMsg("No tienes semillas en el inventario.", "warning");
        return;
    }

    // Use first available seed
    const seedKey = seedKeys[0];
    const plantType = seedKey.replace("seed_", "");
    game.inventory[seedKey]--;
    if (game.inventory[seedKey] <= 0) delete game.inventory[seedKey];

    plantSeed(plotIndex, plantType);
    renderAll();
}

function selectPlot(index) {
    if (game.selectedPlot === index) {
        game.selectedPlot = null;
    } else {
        game.selectedPlot = index;
    }

    // Si la parcela esta vacia e intentamos plantar desde inventario
    const plot = game.plots[index];
    if (!plot.plant && game.selectedPlot === index) {
        const hasSeed = Object.keys(game.inventory).some(k => k.startsWith("seed_") && game.inventory[k] > 0);
        if (hasSeed) {
            logMsg("Parcela seleccionada. Compra semilla o usa inventario.", "info");
        }
    }

    renderAll();
}

function waterPlant() {
    if (game.selectedPlot === null) {
        logMsg("Selecciona una parcela primero!", "warning");
        return;
    }

    const plot = game.plots[game.selectedPlot];
    if (!plot.plant) {
        logMsg("No hay planta en esta parcela!", "warning");
        return;
    }

    if ((game.inventory.agua || 0) <= 0) {
        logMsg("No tienes agua! Compra en la tienda.", "warning");
        return;
    }

    game.inventory.agua--;
    if (game.inventory.agua <= 0) delete game.inventory.agua;

    const plant = PLANTS[plot.plantType];
    plot.water = Math.min(plot.water + 30, 100);
    plot.health = Math.min(plot.health + 5, 100);

    logMsg(`💧 Regaste ${plant.name}. Agua: ${plot.water}%`, "info");
    renderAll();
}

function mutatePlant() {
    if (game.selectedPlot === null) {
        logMsg("Selecciona una parcela primero!", "warning");
        return;
    }

    const plot = game.plots[game.selectedPlot];
    if (!plot.plant) {
        logMsg("No hay planta en esta parcela!", "warning");
        return;
    }

    if ((game.inventory.mutagen || 0) <= 0) {
        logMsg("No tienes Mutageno-X! Compra en la tienda.", "warning");
        return;
    }

    game.inventory.mutagen--;
    if (game.inventory.mutagen <= 0) delete game.inventory.mutagen;

    const plant = PLANTS[plot.plantType];
    const boost = 20;
    plot.radiation = Math.min(plot.radiation + boost, plant.maxRadiation);

    // La mutacion tiene riesgo
    if (plot.radiation > 80 && Math.random() < 0.15) {
        plot.health -= 15;
        logMsg(`⚠️ Mutacion inestable! ${plant.name} perdio salud.`, "danger");
    }

    logMsg(`☢️ Mutaste ${plant.name}. Radiacion: ${plot.radiation}%`, "warning");
    renderAll();
}

function fertilizePlant() {
    if (game.selectedPlot === null) {
        logMsg("Selecciona una parcela primero!", "warning");
        return;
    }

    const plot = game.plots[game.selectedPlot];
    if (!plot.plant) {
        logMsg("No hay planta en esta parcela!", "warning");
        return;
    }

    if ((game.inventory.fertilizer || 0) <= 0) {
        logMsg("No tienes fertilizante!", "warning");
        return;
    }

    game.inventory.fertilizer--;
    if (game.inventory.fertilizer <= 0) delete game.inventory.fertilizer;

    // Avanza un stage si es posible
    const plant = PLANTS[plot.plantType];
    if (plot.stage < plant.stages.length - 1) {
        plot.stage++;
        logMsg(`🧪 Fertilizaste ${plant.name}. Crecio mas rapido!`, "success");
    } else {
        logMsg(`🧪 ${plant.name} ya esta en su etapa maxima.`, "info");
    }

    renderAll();
}

function useShield() {
    if (game.selectedPlot === null) {
        logMsg("Selecciona una parcela primero!", "warning");
        return;
    }

    const plot = game.plots[game.selectedPlot];
    if (!plot.plant) {
        logMsg("No hay planta en esta parcela!", "warning");
        return;
    }

    if ((game.inventory.shield || 0) <= 0) {
        logMsg("No tienes escudos!", "warning");
        return;
    }

    game.inventory.shield--;
    if (game.inventory.shield <= 0) delete game.inventory.shield;

    plot.shieldDays = 3;
    logMsg(`🛡️ Escudo activado por 3 dias en ${PLANTS[plot.plantType].name}.`, "success");
    renderAll();
}

function harvestPlant() {
    if (game.selectedPlot === null) {
        logMsg("Selecciona una parcela primero!", "warning");
        return;
    }

    const plot = game.plots[game.selectedPlot];
    if (!plot.plant) {
        logMsg("No hay planta en esta parcela!", "warning");
        return;
    }

    const plant = PLANTS[plot.plantType];
    if (!plot.ready) {
        logMsg(`${plant.name} aun no esta lista para cosechar!`, "warning");
        return;
    }

    // Calcular valor
    const radiationBonus = (plot.radiation / 100) * plant.radiationBoost;
    const healthMultiplier = plot.health / 100;
    const value = Math.floor(plant.basePrice * (1 + radiationBonus) * healthMultiplier);

    game.harvested.push({
        type: plot.plantType,
        name: plant.name,
        icon: plant.icon,
        radiation: plot.radiation,
        value: value,
        health: plot.health
    });

    game.totalHarvests++;

    logMsg(`✂ Cosechaste ${plant.icon} ${plant.name}! Valor: $${value}`, "success");

    // Limpiar parcela
    game.plots[game.selectedPlot] = createEmptyPlot();
    game.selectedPlot = null;

    renderAll();
}

function sellHarvest() {
    if (game.harvested.length === 0) {
        logMsg("No tienes plantas cosechadas para vender!", "warning");
        return;
    }

    let totalSale = 0;
    const multiplier = game.priceMultiplier;

    game.harvested.forEach(h => {
        const salePrice = Math.floor(h.value * multiplier);
        totalSale += salePrice;
    });

    game.money += totalSale;
    game.totalEarnings += totalSale;

    const count = game.harvested.length;

    // Check contract fulfillment
    if (game.activeContract) {
        checkContractFulfillment();
    }

    game.harvested = [];
    game.priceMultiplier = 1;

    logMsg(`💰 Vendiste ${count} planta(s) por $${totalSale}!`, "money");

    checkLevelUp();
    renderAll();
}

function checkContractFulfillment() {
    const c = game.activeContract;
    if (!c) return;

    let matching = game.harvested.filter(h => {
        if (c.plantType && h.type !== c.plantType) return false;
        if (h.radiation < c.minRadiation) return false;
        return true;
    });

    if (matching.length >= c.qty) {
        game.money += c.reward;
        game.totalEarnings += c.reward;
        game.reputation = Math.min(game.reputation + c.repBonus, game.maxReputation);
        game.totalContractsCompleted++;

        logMsg(`🎖️ CONTRATO COMPLETADO: ${c.name}! +$${c.reward}`, "success");
        game.activeContract = null;
        generateContracts();
    }
}

// ---- CONTRATOS ----

function generateContracts() {
    game.contracts = [];
    const available = CONTRACT_TEMPLATES.filter(c => {
        if (c.plantType === "uranio_azul" && game.level < 3) return false;
        if (c.plantType === "cesio_dorado" && game.level < 5) return false;
        return true;
    });

    // Pick 2-3 random contracts
    const count = Math.min(2 + Math.floor(game.level / 3), available.length);
    const shuffled = [...available].sort(() => Math.random() - 0.5);

    for (let i = 0; i < count; i++) {
        const template = shuffled[i];
        const scaling = 1 + (game.level - 1) * 0.15;
        game.contracts.push({
            ...template,
            reward: Math.floor(template.reward * scaling),
            id: Date.now() + i
        });
    }
}

function acceptContract(index) {
    if (game.activeContract) {
        logMsg("Ya tienes un contrato activo! Completalo primero.", "warning");
        return;
    }

    game.activeContract = game.contracts[index];
    logMsg(`📋 Aceptaste contrato: ${game.activeContract.name}`, "success");
    renderAll();
}

// ---- EXPANSION ----

function expandFarm() {
    const cost = 1000 + (game.gridSize.rows - 3) * 500;

    if (game.money < cost) {
        logMsg(`Necesitas $${cost} para expandir!`, "warning");
        return;
    }

    game.money -= cost;
    game.gridSize.rows++;

    const newPlots = game.gridSize.cols;
    for (let i = 0; i < newPlots; i++) {
        game.plots.push(createEmptyPlot());
    }

    logMsg(`⊞ Granja expandida! Ahora tienes ${game.plots.length} parcelas.`, "success");
    renderAll();
}

// ---- PASO DEL DIA ----

function nextDay() {
    game.day++;
    game.priceMultiplier = 1;

    // Procesar cada parcela
    game.plots.forEach((plot, i) => {
        if (!plot.plant) return;

        const plant = PLANTS[plot.plantType];

        // Agua se evapora
        plot.water = Math.max(plot.water - 15, 0);

        // Crecer si tiene suficiente agua
        if (plot.water >= 20) {
            const daysGrown = game.day - plot.dayPlanted;
            const stagesCount = plant.stages.length;
            const daysPerStage = Math.ceil(plant.growthDays / stagesCount);
            const newStage = Math.min(Math.floor(daysGrown / daysPerStage), stagesCount - 1);

            if (newStage > plot.stage) {
                plot.stage = newStage;
            }

            // Lista para cosechar
            if (plot.stage >= stagesCount - 1) {
                plot.ready = true;
            }
        }

        // Sin agua pierde salud
        if (plot.water <= 0) {
            plot.health = Math.max(plot.health - 10, 0);
        }

        // Escudo
        if (plot.shieldDays > 0) {
            plot.shieldDays--;
        }

        // Planta muerta
        if (plot.health <= 0) {
            logMsg(`💀 ${plant.name} en parcela ${i + 1} murio!`, "danger");
            game.plots[i] = createEmptyPlot();
        }
    });

    // Evento aleatorio
    processRandomEvent();

    // Nuevos contratos cada 5 dias
    if (game.day % 5 === 0 && !game.activeContract) {
        generateContracts();
        logMsg("📋 Nuevos contratos disponibles!", "event");
    }

    logMsg(`▶ Dia ${game.day}`, "info");
    checkLevelUp();
    checkWinCondition();
    renderAll();
}

function processRandomEvent() {
    if (Math.random() > 0.4) {
        game.eventToday = null;
        return;
    }

    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    game.eventToday = event;
    logMsg(event.msg, "event");

    switch (event.effect) {
        case "rain":
            game.plots.forEach(p => {
                if (p.plant) p.water = Math.min(p.water + 40, 100);
            });
            break;

        case "radiation_boost":
            game.plots.forEach(p => {
                if (p.plant) {
                    const max = PLANTS[p.plantType].maxRadiation;
                    p.radiation = Math.min(p.radiation + 15, max);
                }
            });
            break;

        case "plague":
            game.plots.forEach(p => {
                if (p.plant && p.shieldDays <= 0) {
                    p.health = Math.max(p.health - 20, 0);
                }
            });
            break;

        case "reputation":
            game.reputation = Math.min(game.reputation + 2, game.maxReputation);
            break;

        case "solar_storm":
            game.plots.forEach(p => {
                if (p.plant && Math.random() < 0.4) {
                    p.radiation = Math.max(p.radiation - 15, 0);
                }
            });
            break;

        case "price_boost":
            game.priceMultiplier = 2;
            break;

        case "earthquake":
            game.plots.forEach(p => {
                if (p.plant && Math.random() < 0.2) {
                    p.damaged = true;
                    p.health = Math.max(p.health - 30, 0);
                }
            });
            break;
    }
}

// ---- NIVEL Y PROGRESION ----

function checkLevelUp() {
    const thresholds = [0, 500, 1500, 3500, 7000, 12000, 20000, 35000, 50000, 100000];
    let newLevel = 1;
    for (let i = thresholds.length - 1; i >= 0; i--) {
        if (game.totalEarnings >= thresholds[i]) {
            newLevel = i + 1;
            break;
        }
    }

    if (newLevel > game.level) {
        game.level = newLevel;
        logMsg(`⬆ SUBISTE AL NIVEL ${game.level}!`, "success");

        if (newLevel === 2) logMsg("🔓 Semillas de Torio Purpura desbloqueadas!", "event");
        if (newLevel === 3) logMsg("🔓 Semillas de Uranio Azul desbloqueadas!", "event");
        if (newLevel === 5) logMsg("🔓 Semillas de Cesio Dorado desbloqueadas!", "event");
    }
}

function checkWinCondition() {
    if (game.level >= 10 && game.reputation >= 45) {
        showEndScreen(true);
    }
    if (game.money <= 0 && game.harvested.length === 0 && !game.plots.some(p => p.plant)) {
        showEndScreen(false);
    }
}

function getReputationStars() {
    const maxStars = 5;
    const filled = Math.floor((game.reputation / game.maxReputation) * maxStars);
    return "★".repeat(filled) + "☆".repeat(maxStars - filled);
}

// ---- RENDERIZADO ----

function renderAll() {
    renderHUD();
    renderFarm();
    renderShop();
    renderInventory();
    renderContracts();
    renderExpandButton();
}

function renderHUD() {
    document.getElementById("money").textContent = `$${game.money}`;
    document.getElementById("day").textContent = game.day;
    document.getElementById("level").textContent = game.level;
    document.getElementById("reputation").textContent = getReputationStars();
}

function renderFarm() {
    const grid = document.getElementById("farm-grid");
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = `repeat(${game.gridSize.cols}, 1fr)`;

    game.plots.forEach((plot, index) => {
        const div = document.createElement("div");
        div.className = "plot";
        div.onclick = () => selectPlot(index);

        if (index === game.selectedPlot) div.classList.add("selected");

        if (!plot.plant) {
            div.classList.add("empty");
            div.innerHTML = `
                <span class="plant-icon" style="color:#333;font-size:18px">+</span>
                <span class="plant-name">VACIA</span>
            `;

            // Double click to plant from inventory
            div.ondblclick = () => plantFromInventory(index);
        } else {
            const plant = PLANTS[plot.plantType];
            const stageIcon = plant.stages[plot.stage];

            // Glow class based on radiation
            if (plot.radiation > 60) div.classList.add("glow-high");
            else if (plot.radiation > 30) div.classList.add("glow-mid");
            else if (plot.radiation > 0) div.classList.add("glow-low");

            let statusText = "";
            if (plot.ready) statusText = "✓ LISTA";
            else if (plot.health <= 30) statusText = "⚠ CRITICA";
            else if (plot.shieldDays > 0) statusText = `🛡 ${plot.shieldDays}d`;

            div.innerHTML = `
                <div class="radiation-glow"></div>
                <span class="plant-icon">${stageIcon}</span>
                <span class="plant-name">${plant.name}</span>
                <span class="plant-stage">${statusText || `Etapa ${plot.stage + 1}/${plant.stages.length}`}</span>
                <div class="plot-bars">
                    <div class="mini-bar bar-water" title="Agua ${plot.water}%">
                        <div class="mini-bar-fill" style="width:${plot.water}%"></div>
                    </div>
                    <div class="mini-bar bar-radiation" title="Radiacion ${plot.radiation}%">
                        <div class="mini-bar-fill" style="width:${plot.radiation}%"></div>
                    </div>
                    <div class="mini-bar bar-health" title="Salud ${plot.health}%">
                        <div class="mini-bar-fill" style="width:${plot.health}%"></div>
                    </div>
                </div>
            `;
        }

        grid.appendChild(div);
    });
}

function renderShop() {
    const shopDiv = document.getElementById("shop-items");
    shopDiv.innerHTML = "";

    Object.entries(SHOP_ITEMS).forEach(([id, item]) => {
        if (item.unlockLevel && game.level < item.unlockLevel) return;

        const div = document.createElement("div");
        div.className = "shop-item";
        div.onclick = () => buyItem(id);
        div.title = item.description;

        div.innerHTML = `
            <span><span class="item-icon">${item.icon}</span> <span class="item-name">${item.name}</span></span>
            <span class="item-price">$${item.price}</span>
        `;

        shopDiv.appendChild(div);
    });
}

function renderInventory() {
    const invDiv = document.getElementById("inventory-items");
    invDiv.innerHTML = "";

    const entries = Object.entries(game.inventory).filter(([, v]) => v > 0);

    if (entries.length === 0) {
        invDiv.innerHTML = '<div class="inv-item" style="color:#555">Vacio</div>';
        return;
    }

    entries.forEach(([key, count]) => {
        let name, icon;

        if (key.startsWith("seed_")) {
            const plantType = key.replace("seed_", "");
            const plant = PLANTS[plantType];
            name = `Semilla ${plant ? plant.name : plantType}`;
            icon = "🌱";
        } else if (SHOP_ITEMS[key]) {
            name = SHOP_ITEMS[key].name;
            icon = SHOP_ITEMS[key].icon;
        } else {
            name = key;
            icon = "?";
        }

        const div = document.createElement("div");
        div.className = "inv-item";
        div.innerHTML = `<span>${icon} ${name}</span><span class="inv-count">x${count}</span>`;
        invDiv.appendChild(div);
    });

    // Show harvested plants
    if (game.harvested.length > 0) {
        const header = document.createElement("div");
        header.className = "inv-item";
        header.style.color = "#ff8800";
        header.style.marginTop = "5px";
        header.innerHTML = `<span>--- COSECHADAS ---</span>`;
        invDiv.appendChild(header);

        game.harvested.forEach(h => {
            const div = document.createElement("div");
            div.className = "inv-item";
            div.innerHTML = `<span>${h.icon} ${h.name} (☢${h.radiation}%)</span><span class="inv-count">$${h.value}</span>`;
            invDiv.appendChild(div);
        });
    }
}

function renderContracts() {
    const listDiv = document.getElementById("contract-list");
    listDiv.innerHTML = "";

    if (game.activeContract) {
        const c = game.activeContract;
        const plantName = c.plantType ? PLANTS[c.plantType].name : "Cualquiera";
        const div = document.createElement("div");
        div.className = "contract contract-active";
        div.innerHTML = `
            <div class="contract-name">✓ ${c.name}</div>
            <div class="contract-req">${c.qty}x ${plantName} (☢>${c.minRadiation}%)</div>
            <div class="contract-reward">Recompensa: $${c.reward}</div>
        `;
        listDiv.appendChild(div);
        return;
    }

    if (game.contracts.length === 0) {
        listDiv.innerHTML = '<div style="font-size:7px;color:#555;padding:4px">Sin contratos</div>';
        return;
    }

    game.contracts.forEach((c, i) => {
        const plantName = c.plantType ? PLANTS[c.plantType].name : "Cualquiera";
        const div = document.createElement("div");
        div.className = "contract";
        div.onclick = () => acceptContract(i);
        div.innerHTML = `
            <div class="contract-name">${c.name}</div>
            <div class="contract-req">${c.qty}x ${plantName} (☢>${c.minRadiation}%)</div>
            <div class="contract-reward">Recompensa: $${c.reward}</div>
        `;
        listDiv.appendChild(div);
    });
}

function renderExpandButton() {
    const cost = 1000 + (game.gridSize.rows - 3) * 500;
    const btn = document.getElementById("btn-expand");
    btn.textContent = `⊞ EXPANDIR ($${cost})`;
}

// ---- CONSOLA DE MENSAJES ----

function logMsg(text, type = "info") {
    const container = document.getElementById("console-messages");
    const msg = document.createElement("div");
    msg.className = `console-msg msg-${type}`;
    msg.textContent = `[DIA ${game.day}] ${text}`;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;

    // Limpiar mensajes antiguos
    while (container.children.length > 50) {
        container.removeChild(container.firstChild);
    }
}

// ---- PANTALLA FINAL ----

function showEndScreen(won) {
    document.getElementById("game-screen").classList.add("hidden");
    document.getElementById("end-screen").classList.remove("hidden");

    const title = document.getElementById("end-title");
    const message = document.getElementById("end-message");
    const stats = document.getElementById("end-stats");

    if (won) {
        title.textContent = "☢ VICTORIA ☢";
        title.style.color = "#33ff33";
        message.textContent = "Has construido el arsenal radioactivo mas poderoso del mundo. Los generales te aclaman como el granjero mas letal de la historia. Tu legado nuclear perdurara por siglos.";
    } else {
        title.textContent = "GAME OVER";
        title.style.color = "#ff3333";
        message.textContent = "Tu granja ha caido. Sin dinero, sin cosechas, sin esperanza. Los militares buscan a otro proveedor. Quizas en la proxima vida...";
    }

    stats.innerHTML = `
        <div class="stat-line">Dias sobrevividos: <span class="stat-value">${game.day}</span></div>
        <div class="stat-line">Nivel alcanzado: <span class="stat-value">${game.level}</span></div>
        <div class="stat-line">Dinero total ganado: <span class="stat-value">$${game.totalEarnings}</span></div>
        <div class="stat-line">Plantas cosechadas: <span class="stat-value">${game.totalHarvests}</span></div>
        <div class="stat-line">Contratos completados: <span class="stat-value">${game.totalContractsCompleted}</span></div>
        <div class="stat-line">Reputacion: <span class="stat-value">${getReputationStars()}</span></div>
    `;
}

// ---- GUARDAR / CARGAR ----

function saveGame() {
    try {
        localStorage.setItem("radioactive_harvest_save", JSON.stringify(game));
        logMsg("💾 Juego guardado!", "success");
    } catch (e) {
        logMsg("Error al guardar.", "danger");
    }
}

function loadGame() {
    try {
        const save = localStorage.getItem("radioactive_harvest_save");
        if (save) {
            game = JSON.parse(save);
            renderAll();
            logMsg("💾 Juego cargado!", "success");
            return true;
        }
    } catch (e) {
        logMsg("Error al cargar.", "danger");
    }
    return false;
}

// ---- EVENT LISTENERS ----

document.addEventListener("DOMContentLoaded", () => {
    // Title screen
    document.getElementById("btn-start").addEventListener("click", () => {
        document.getElementById("title-screen").classList.add("hidden");
        document.getElementById("game-screen").classList.remove("hidden");
        initGame();
    });

    // Actions
    document.getElementById("btn-water").addEventListener("click", waterPlant);
    document.getElementById("btn-fertilize").addEventListener("click", mutatePlant);
    document.getElementById("btn-harvest").addEventListener("click", harvestPlant);
    document.getElementById("btn-sell").addEventListener("click", sellHarvest);
    document.getElementById("btn-next-day").addEventListener("click", nextDay);
    document.getElementById("btn-expand").addEventListener("click", expandFarm);
    document.getElementById("btn-save").addEventListener("click", saveGame);
    document.getElementById("btn-restart").addEventListener("click", () => {
        document.getElementById("end-screen").classList.add("hidden");
        document.getElementById("game-screen").classList.remove("hidden");
        initGame();
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
        if (document.getElementById("game-screen").classList.contains("hidden")) return;

        switch (e.key.toLowerCase()) {
            case "w": waterPlant(); break;
            case "m": mutatePlant(); break;
            case "h": harvestPlant(); break;
            case "s": sellHarvest(); break;
            case "n": case " ": nextDay(); e.preventDefault(); break;
        }
    });
});
