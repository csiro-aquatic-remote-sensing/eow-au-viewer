import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StatsComponent } from './stats.component';
import {EowDataLayer} from '../eow-data-layer';
import {EOWMap} from '../eow-map';
import Brolog from 'brolog';

describe('StatsComponent', () => {
  let component: StatsComponent;
  let fixture: ComponentFixture<StatsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StatsComponent ],
      providers: [EowDataLayer, EOWMap, Brolog]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
