// Constants for better maintainability
const DRUG_TYPES = {
  HERBAL_TEA: 'Herbal Tea',
  MAGIC_PILL: 'Magic Pill',
  FERVEX: 'Fervex',
  DAFALGAN: 'Dafalgan'
};

const DRUG_CATEGORIES = {
  PAIN_RELIEF: 'Pain Relief',
  ANTIBIOTICS: 'Antibiotics',
  SUPPLEMENTS: 'Supplements',
  CHRONIC: 'Chronic Disease',
  EMERGENCY: 'Emergency'
};

const LIMITS = {
  MAX_BENEFIT: 50,
  MIN_BENEFIT: 0,
  FERVEX_THRESHOLD_1: 10,
  FERVEX_THRESHOLD_2: 5,
  LOW_STOCK_THRESHOLD: 5,
  CRITICAL_EXPIRY_DAYS: 7
};

class Drug {
  constructor(name, expiresIn, benefit, category, stock = 0, reorderPoint = LIMITS.LOW_STOCK_THRESHOLD) {
      if (typeof name !== 'string' || typeof expiresIn !== 'number' || typeof benefit !== 'number') {
          throw new Error('Invalid drug parameters');
      }
      this.name = name;
      this.expiresIn = expiresIn;
      this.benefit = benefit;
      this.category = category;
      this.stock = stock;
      this.reorderPoint = reorderPoint;
      this.batchNumber = this.generateBatchNumber();
  }

  generateBatchNumber() {
      return `${this.name.substring(0, 3).toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  needsReorder() {
      return this.stock <= this.reorderPoint;
  }

  isExpiringSoon() {
      return this.expiresIn <= LIMITS.CRITICAL_EXPIRY_DAYS;
  }

}

// Strategy pattern for drug benefit calculations
const drugStrategies = {
  [DRUG_TYPES.MAGIC_PILL]: {
      updateBenefit: (drug) => drug,
      updateExpiration: (drug) => drug
  },

  [DRUG_TYPES.HERBAL_TEA]: {
      updateBenefit: (drug) => {
          const increment = drug.expiresIn <= 0 ? 2 : 1;
          drug.benefit = Math.min(LIMITS.MAX_BENEFIT, drug.benefit + increment);
          return drug;
      },
      updateExpiration: (drug) => {
          drug.expiresIn--;
          return drug;
      }
  },

  [DRUG_TYPES.FERVEX]: {
      updateBenefit: (drug) => {
          if (drug.expiresIn <= 0) {
              drug.benefit = 0;
              return drug;
          }
          
          let increment = 1;
          if (drug.expiresIn <= LIMITS.FERVEX_THRESHOLD_2) increment = 3;
          else if (drug.expiresIn <= LIMITS.FERVEX_THRESHOLD_1) increment = 2;
          
          drug.benefit = Math.min(LIMITS.MAX_BENEFIT, drug.benefit + increment);
          return drug;
      },
      updateExpiration: (drug) => {
          drug.expiresIn--;
          return drug;
      }
  },

  [DRUG_TYPES.DAFALGAN]: {
      updateBenefit: (drug) => {
          const decrement = drug.expiresIn <= 0 ? 4 : 2;
          drug.benefit = Math.max(LIMITS.MIN_BENEFIT, drug.benefit - decrement);
          return drug;
      },
      updateExpiration: (drug) => {
          drug.expiresIn--;
          return drug;
      }
  }
};

class Pharmacy {
  constructor(drugs = []) {
      if (!Array.isArray(drugs)) {
          throw new Error('Drugs must be an array');
      }
      this.drugs = drugs;
      this.alerts = [];
      this.transactions = [];
  }

  getStrategy(drugName) {
      return drugStrategies[drugName] || {
          updateBenefit: (drug) => {
              const decrement = drug.expiresIn <= 0 ? 2 : 1;
              drug.benefit = Math.max(LIMITS.MIN_BENEFIT, drug.benefit - decrement);
              return drug;
          },
          updateExpiration: (drug) => {
              drug.expiresIn--;
              return drug;
          }
      };
  }

  updateBenefitValue() {
      return this.drugs.map(drug => {
          const strategy = this.getStrategy(drug.name);
          strategy.updateBenefit(drug);
          strategy.updateExpiration(drug);
          this.checkAlerts(drug);
          return drug;
      });
  }

  checkAlerts(drug) {
      if (drug.needsReorder()) {
          this.addAlert({
              type: 'LOW_STOCK',
              drugName: drug.name,
              currentStock: drug.stock,
              reorderPoint: drug.reorderPoint,
              timestamp: new Date()
          });
      }

      if (drug.isExpiringSoon()) {
          this.addAlert({
              type: 'EXPIRING_SOON',
              drugName: drug.name,
              expiresIn: drug.expiresIn,
              timestamp: new Date()
          });
      }
  }

  addAlert(alert) {
      this.alerts.push(alert);
  }

  getAlerts(type = null) {
      return type 
          ? this.alerts.filter(alert => alert.type === type)
          : this.alerts;
  }

  clearAlerts() {
      this.alerts = [];
  }

}

module.exports = { 
  Drug, 
  Pharmacy, 
  DRUG_TYPES, 
  DRUG_CATEGORIES, 
  LIMITS 
};
