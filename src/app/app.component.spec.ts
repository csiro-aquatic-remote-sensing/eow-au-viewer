import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import Brolog from 'brolog';
import {SidebarComponent} from './sidebar/sidebar.component';
import {EOWMap} from './eow-map';
import {EowDataLayer} from './eow-data-layer';
import {ApplicationLayers} from './layers';
import {EowLayers} from './eow-layers';
import EowDataGeometries from './eow-data-geometries';
import LayerGeometries from './layers-geometries';
import EowDataCharts from './charts/eow-data-charts';
import SideBarService from './sidebar/sidebar.service';
import {HeaderComponent} from './header/header.component';
import {StatsComponent} from './stats/stats.component';
import {UserService} from './sidebar/users/user.service';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent, SidebarComponent, HeaderComponent, StatsComponent
      ],
      imports: [HttpClientTestingModule],
      providers: [Brolog, EOWMap, UserService, EowDataLayer, ApplicationLayers, EowLayers, EowDataGeometries, LayerGeometries,
        EowDataCharts, SideBarService]
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'Eye On Water'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('Eye On Water');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('div#measurements h5').textContent).toContain('Recent measurements');
  });
});
