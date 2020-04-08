import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {HttpClientModule} from '@angular/common/http';
import {Brolog} from 'brolog';
import {brologLevel} from './globals';
import { SidebarComponent } from './sidebar/sidebar.component';
import EowDataGeometries from './eow-data-geometries';
import {EowDataLayer} from './eow-data-layer';
import {EowDataStruct} from './eow-data-struct';
import EowDataCharts from './charts/eow-data-charts';
import {EOWMap} from './eow-map';
import {EowLayers} from './eow-layers';
import {ApplicationLayers} from './layers';
import LayerGeometries from './layers-geometries';
import SideBarService from './sidebar/sidebar.service';
import {jqxTabsModule} from 'jqwidgets-framework/jqwidgets-ng/jqxtabs';
import {jqxCheckBoxModule} from 'jqwidgets-framework/jqwidgets-ng/jqxcheckbox';
import {jqxWindowModule} from 'jqwidgets-framework/jqwidgets-ng/jqxwindow';
import {jqxButtonModule} from 'jqwidgets-framework/jqwidgets-ng/jqxbuttons';
import { HeaderComponent } from './header/header.component';
import { StatsComponent } from './stats/stats.component';
import { MeasurementsComponent } from './sidebar/measurements/measurements.component';
import { UsersComponent } from './sidebar/users/users.component';
import { LoginComponent } from './header/login/login.component';
import {SidebarStatsService} from './stats/stats.sidebar.service';
import {HeaderStatsService} from './stats/stats.header.service';
import { EowDataComponent } from './sidebar/eow-data/eow-data.component';
import {LoginService} from './header/login/login.service';
import { TooltipModule } from 'ng2-tooltip-directive';

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    HeaderComponent,
    StatsComponent,
    MeasurementsComponent,
    UsersComponent,
    LoginComponent,
    EowDataComponent
  ],
  imports: [
    BrowserModule, HttpClientModule, jqxButtonModule, jqxWindowModule, jqxCheckBoxModule, jqxTabsModule, TooltipModule
  ],
  providers: [
    {
      provide: Brolog,
      // 'silent' | 'error' | 'warn' | 'info' | 'verbose' | 'silly'
      useFactory: function brologFactory() { return Brolog.instance(brologLevel); },
    },
    EowDataGeometries, EowDataLayer, EowDataStruct, EowDataLayer, EowDataCharts, EOWMap,
    EowLayers, ApplicationLayers, LayerGeometries, SideBarService, SidebarStatsService, HeaderStatsService, LoginService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
