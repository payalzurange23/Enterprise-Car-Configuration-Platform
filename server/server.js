const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

const DB_PATH = path.join(__dirname, 'data', 'database.json');

// Helper to read database
const getDB = () => {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
};

// Helper to save database
const saveDB = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// GET all options
app.get('/api/options', (req, res) => {
    const db = getDB();
    const { savedConfigurations, ...options } = db;
    res.json(options);
});

// POST validate configuration
app.post('/api/validate', (req, res) => {
    const { selection } = req.body; // selection is an object { modelId, engineId, ... }
    const db = getDB();
    const rules = db.rules;
    
    let violations = [];
    let autoAdjustments = [];

    rules.forEach(rule => {
        const conditionMatches = Object.keys(rule.condition).every(key => 
            selection[key] === rule.condition[key]
        );

        if (conditionMatches) {
            Object.keys(rule.restrictedOptions).forEach(key => {
                const restrictedIds = rule.restrictedOptions[key];
                if (restrictedIds.includes(selection[key])) {
                    violations.push({
                        rule: rule.description,
                        field: key,
                        invalidValue: selection[key]
                    });
                }
            });
        }
    });

    res.json({
        valid: violations.length === 0,
        violations,
        autoAdjustments
    });
});

// POST calculate price
app.post('/api/price', (req, res) => {
    const { selection } = req.body;
    const db = getDB();
    let totalPrice = 0;

    // Base price from model
    const model = db.models.find(m => m.id === selection.modelId);
    if (model) totalPrice += model.basePrice;

    // Component prices
    const components = ['engines', 'transmissions', 'trims', 'exteriors', 'interiors', 'wheels'];
    components.forEach(compKey => {
        const list = db[compKey];
        const selectedId = selection[compKey.slice(0, -1) + 'Id'];
        const item = list.find(i => i.id === selectedId);
        if (item) totalPrice += item.price;
    });

    // Packages
    if (selection.packageIds && Array.isArray(selection.packageIds)) {
        selection.packageIds.forEach(pId => {
            const pkg = db.packages.find(p => p.id === pId);
            if (pkg) totalPrice += pkg.price;
        });
    }

    res.json({ totalPrice });
});

// GET all saved configurations
app.get('/api/history', (req, res) => {
    const db = getDB();
    
    // Ensure all historical items have a price (for viva presentation quality)
    const historyWithPrices = db.savedConfigurations.map(item => {
        if (item.totalPrice) return item;
        
        let price = 0;
        const model = db.models.find(m => m.id === item.config.modelId);
        if (model) price += model.basePrice;
        
        const components = ['engines', 'transmissions', 'trims', 'exteriors', 'interiors', 'wheels'];
        components.forEach(compKey => {
            const list = db[compKey];
            const selectedId = item.config[compKey.slice(0, -1) + 'Id'];
            const comp = list.find(i => i.id === selectedId);
            if (comp) price += comp.price;
        });

        if (item.config.packageIds) {
            item.config.packageIds.forEach(pId => {
                const pkg = db.packages.find(p => p.id === pId);
                if (pkg) price += pkg.price;
            });
        }
        
        return { ...item, totalPrice: price };
    });

    res.json(historyWithPrices);
});

// POST save configuration
app.post('/api/save', (req, res) => {
    const { config, name, type, totalPrice } = req.body;
    const db = getDB();
    
    // Find model name for the save entry
    const model = db.models.find(m => m.id === config.modelId);
    
    const newSave = {
        id: 'conf_' + Date.now(),
        name: name || `${model ? model.name : 'Custom'} Build`,
        config,
        totalPrice,
        type: type || 'quote', // quote vs order
        createdAt: new Date().toISOString()
    };

    db.savedConfigurations.push(newSave);
    saveDB(db);

    res.json({ success: true, configuration: newSave });
});

app.listen(PORT, () => {
    console.log(`ECP Backend running at http://localhost:${PORT}`);
});
