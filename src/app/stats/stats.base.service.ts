import {Injectable} from '@angular/core';
import {EowBaseService} from '../eow-base-service';

export type StatsItemAmount = { [item: string]: number }; // tslint:disable-line

export class Stats {
  iPhones = 0;
  androids = 0;
  mostUsedDevice: StatsItemAmount = {};
  mostReportedFU: StatsItemAmount = {};
  mostActiveUser: StatsItemAmount = {};
  avgFU = 0;
  eowAu = 0;
  eowGlobal = 0;
}

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

  get stats() {
    return this._stats;
  }

  calculateStats(features) {
    const stats = new Stats();
    const users: StatsItemAmount = {};
    const fuValues: StatsItemAmount = {};
    const devices: StatsItemAmount = {};
    // collect and aggregate

    const getLargestAmount = (collection: StatsItemAmount) => {
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
    };

    if (features && features.length) {
      const allStats = features.reduce((rStats, feature) => {
        const properties = feature.getProperties();
        const incrementAddProperty = (theObject, property) => {
          if (property) {
            theObject[property] = theObject.hasOwnProperty(property) ? Math.trunc(theObject[property] + 1) : 1;
          }
        };

        // Only count users from EOW AU
        if (properties.application === 'australia') {
          incrementAddProperty(users, properties.user_n_code);
        }
        incrementAddProperty(fuValues, properties.fu_value);
        incrementAddProperty(devices, properties.device_model);
        incrementAddProperty(rStats, properties.device_platform === 'iOS' ? 'iPhones' : 'androids');
        incrementAddProperty(rStats, properties.application === 'australia' ? 'eowAu' : 'eowGlobal');
        return rStats;
      }, stats);

      const mostReportedFU = getLargestAmount(fuValues);
      const mostUsedDevice = getLargestAmount(devices);
      const mostActiveUser = getLargestAmount(Object.assign({}, users, {
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
}
