import {Injectable} from '@angular/core';
import {EowBaseService} from '../eow-base-service';

export type StatsItemAmount = { [item: string]: number }; // tslint:disable-line

export class Stats {
  iPhones = 0;
  androids = 0;
  mostUsedDevice: StatsItemAmount = {}; // new StatsItemAmount();
  mostReportedFU: StatsItemAmount = {}; // new StatsItemAmount();
  mostActiveUser: StatsItemAmount = {}; // new StatsItemAmount();
  avgFU = 0;
  eowAu = 0;
  eowGlobal = 0;

  // set iPhones(value) {
  //   this._iPhones = value;
  // }
  //
  // get iPhones() {
  //   return this._iPhones;
  // }
  //
  // set androids(value) {
  //   this._androids = value;
  // }
  //
  // get androids() {
  //   return this._androids;
  // }
  //
  // set avgFU(value) {
  //   this._avgFU = value;
  // }
  //
  // get avgFU() {
  //   return this._avgFU;
  // }
  //
  // set eowAu(value) {
  //   this._eowAu = value;
  // }
  //
  // get eowAu() {
  //   return this._eowAu;
  // }
  //
  // set eowGlobal(value) {
  //   this._eowGlobal = value;
  // }
  //
  // get eowGlobal() {
  //   return this._eowGlobal;
  // }
  //
  // get mostUsedDevice() {
  //   return this._mostUsedDevice;
  // }
  //
  // get mostReportedFU() {
  //   return this._mostReportedFU;
  // }
  //
  // get mostActiveUser() {
  //   return this._mostActiveUser;
  // }
}

// @Injectable({
//   providedIn: 'root'
// })
@Injectable()
export abstract class StatsServiceBase extends EowBaseService {
  private _stats: Stats = new Stats();

  constructor() {
    super();
  }

  destroy() {
    super.destroy();
  }

  /**
   * Create the map overlay.
   * @param elementId to draw into
   */
  init() {
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
  }

  //   The stats are automatically - REMOVE THIS GOING IN HEADER
  // this.subscriptions.push(this.eowDataLayer.allDataSourceObs.subscribe(allDataSource => {
  //   if (allDataSource) {
  //     @ts-ignore
  //     this.dataLayer.on('change', debounce(({target}) => {
  // this.calculateStats(allDataSource.getFeatures());
  // }));
  // }
  // }));
  // }

  // get statsObs() {
  //   return this._statsObs.asObservable();
  // }

  get stats() {
    return this._stats;
  }

  calculateStats(features) {
    const stats = new Stats();
    const users: StatsItemAmount = {};  // stats.mostActiveUser;
    const fuValues: StatsItemAmount = {};  // stats.mostReportedFU;
    const devices: StatsItemAmount = {};  // stats.mostUsedDevice;
    // collect and aggregate

    if (features && features.length) {
      const allStats = features.reduce((rStats, feature) => {
        const properties = feature.getProperties();
        const incrementIfProperty = (theObject, property) => {
          if (property) {
            theObject[property] = theObject.hasOwnProperty(property) ? Math.trunc(theObject[property] + 1) : 1;
          }
        };
        // ~~ to coerce NaN/undefined to 0
        // Only count users from EOW AU
        if (properties.application === 'australia') {
          incrementIfProperty(users, properties.user_n_code);
          // users[properties.user_n_code] = users.hasOwnProperty(properties.user_n_code) ? Math.trunc(users[properties.user_n_code] + 1) : 1;  // replace ~~
        }
        incrementIfProperty(fuValues, properties.fu_value);
        // fuValues[properties.fu_value] = fuValues.hasOwnProperty(properties.fu_value) ? Math.trunc(fuValues[properties.fu_value] + 1) : 1;
        incrementIfProperty(devices, properties.device_model);
        // devices[properties.device_model] = devices.hasOwnProperty(properties.device_model) ? Math.trunc(devices[properties.device_model] + 1) : 1;
        // rStats[properties.device_platform === 'iOS' ? 'iphones' : 'androids'] += 1;
        // rStats[properties.application === 'australia' ? 'eowAu' : 'eowGlobal'] += 1;
        incrementIfProperty(rStats, properties.device_platform === 'iOS' ? 'iPhones' : 'androids');
        incrementIfProperty(rStats, properties.application === 'australia' ? 'eowAu' : 'eowGlobal');
        return rStats;
      }, stats);

      const mostReportedFU = this.getLargestAmount(fuValues);
      const mostUsedDevice = this.getLargestAmount(devices);
      const mostActiveUser = this.getLargestAmount(Object.assign({}, users, {
        null: -2
      }));

      const avgFU = (Object.entries(fuValues).reduce((prev, [fu, amount]) => {
        return prev + (parseInt(fu, 10) * amount);
      }, 0) / features.length).toFixed(2);

      this._stats = Object.assign({}, allStats, {
        mostReportedFU,
        avgFU,
        mostUsedDevice,
        mostActiveUser
      });
    }
  }

  private getLargestAmount(collection: StatsItemAmount) {
    return Object.entries(collection).reduce((prev, [item, amount]) => {
      if (amount > prev.amount) {
        prev = {
          item,
          amount
        };
      }
      return prev;
    }, {
      item: null,
      amount: -1
    });
  }
}
