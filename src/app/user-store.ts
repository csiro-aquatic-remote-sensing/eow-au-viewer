import orderBy from 'lodash/orderBy';
import keyBy from 'lodash/keyBy';
import debounce from 'lodash/debounce';
import {
  printStats,
  calculateStats,
} from './utils';
import Brolog from 'brolog';
import {BehaviorSubject} from 'rxjs';

export class UserStore {
  // htmlDocument: Document;
  users: [];
  userById: {};
  dataLayerObs: BehaviorSubject<any>;

  constructor(private htmlDocument: Document, private log: Brolog) {
  }

  async init(dataLayerObs: BehaviorSubject<any>): Promise<void> {
    this.dataLayerObs = dataLayerObs;
    const USER_SERVICE = 'https://www.eyeonwater.org/api/users';

    async function loadUsers() {
      // TODO I'm curious as to if this is correct under Angular
      const response = await window.fetch(USER_SERVICE);
      const {
        results: {
          users
        }
      } = await response.json();
      return users;
    }

// Load users
    return new Promise((resolve) => {
      loadUsers().then((users) => {
        this.users = users;
        this.userById = keyBy(this.users, 'id');
        this.renderUsers(this.users);
        this.log.info(`Users Loaded - ids: ${JSON.stringify(Object.keys(this.userById))}`);
        this.setupEventHandlers();
        resolve();
      });
    });
  }

  setupEventHandlers() {
    this.dataLayerObs.asObservable().subscribe(dataLayer => {
      dataLayer.on('change', debounce(({target}) => {
        // Populate datalayer
        const element = this.htmlDocument.querySelector('.sub-header-stats') as HTMLElement;
        element.innerHTML = printStats(calculateStats(target.getSource().getFeatures()), this);
      }, 200));
    });
  }

  getUserById(userId) {
    return this.userById[userId] || {};
  }

  clearSelectedUser() {
    this.htmlDocument.querySelectorAll('.user-list .item').forEach(item => {
      item.classList.remove('selectedUser', 'box-shadow');
    });
  }

  renderUsers(users, n = 10) {
    // Atleast temporarily filter so only users with photos show
    const userList = orderBy(users, ['photo_count', 'points'], ['desc', 'desc']).slice(0, n)
      .filter(user => this.getUserById(user.id).photos.length > 0) // user => user.photo_count && user.photo_count > 0)
      .map(user => {
        console.log(`renderUsers - add user ${user.id}, ${user.nickname}`);
        return `
            <li class="item" data-user="${user.id}">
              <div>
                <img  class="icon-thumb" src="https://eyeonwater.org/grfx/${user.icon}">
              </div>
              <div>
                <div class="item-nickname">${user.nickname}</div>
                <div class="item-photo-count">(${user.photo_count} photos)</div>
                <div class="item-points">${user.points} points (level ${user.level})</div>
              </div>
            </li>`;
      });

    if (userList.length > 0) {
      const results = userList.join('\n')
        + `<br/>There are ${users.length - userList.length} other users that have no photos to display.`;
      this.htmlDocument.querySelector('.user-list ul').innerHTML = results;
    } else {
      this.htmlDocument.querySelector('.user-list ul').innerHTML =
        `There are no users with photos<br/>(There are ${users.length} in total).`;
    }
  }

  userExists(userId) {
    return Object.keys(this.getUserById(userId)).length > 0;
  }
}
