import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {HttpClientModule} from '@angular/common/http';
import {Brolog} from 'brolog';
import {brologLevel} from './globals';
import { SidebarComponent } from './sidebar/sidebar.component';
import {MeasurementStore} from './sidebar/measurement-store';
import {UserStore} from './sidebar/user-store';
import EowDataGeometries from './eow-data-geometries';
import {EowDataLayer} from './eow-data-layer';
import {EowDataStruct} from './eow-data-struct';
import EowDataCharts from './charts/eow-data-charts';
import {EOWMap} from './eow-map';
import {EowLayers} from './eow-layers';
import {ApplicationLayers} from './layers';
import {Popup} from './sidebar/popup';
import LayerGeometries from './layers-geometries';
import SideBarService from './sidebar/sidebar.service';
import {jqxTabsModule} from 'jqwidgets-framework/jqwidgets-ng/jqxtabs';
import {jqxCheckBoxModule} from 'jqwidgets-framework/jqwidgets-ng/jqxcheckbox';
import {jqxWindowModule} from 'jqwidgets-framework/jqwidgets-ng/jqxwindow';
import {jqxButtonModule} from 'jqwidgets-framework/jqwidgets-ng/jqxbuttons';

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent
  ],
  imports: [
    BrowserModule, HttpClientModule, jqxButtonModule, jqxWindowModule, jqxCheckBoxModule, jqxTabsModule
  ],
  providers: [
    {
      provide: Brolog,
      // 'silent' | 'error' | 'warn' | 'info' | 'verbose' | 'silly'
      useFactory: function brologFactory() { return Brolog.instance(brologLevel); },
    },
    MeasurementStore, UserStore, EowDataGeometries, EowDataLayer, EowDataStruct, EowDataLayer, EowDataCharts, EOWMap,
    EowLayers, ApplicationLayers, Popup, LayerGeometries, SideBarService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
