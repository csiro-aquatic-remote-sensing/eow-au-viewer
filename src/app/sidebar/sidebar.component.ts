import {Component, Inject, OnInit} from '@angular/core';
import {Popup} from './popup';
import {MeasurementStore} from './measurement-store';
import {UserStore} from './user-store';
import {DOCUMENT} from '@angular/common';
import {Brolog} from 'brolog';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  popupObject: Popup;
  measurementStore: MeasurementStore;
  userStore: UserStore;

  constructor(@Inject(DOCUMENT) private htmlDocument: Document, private log: Brolog) {

  }

  async ngOnInit() {
    // this.userStore = new UserStore(this.htmlDocument, this.log);
    // this.popupObject = new Popup(this.htmlDocument, this.userStore);
    // this.measurementStore = await new MeasurementStore(this.log);
    // this.popupObject.init(this.eowMap);
    // this.measurementStore.init(this.eowMap, this.eowData, this.userStore);
    // await this.userStore.init(this.eowData, this.measurementStore);

  }
}
