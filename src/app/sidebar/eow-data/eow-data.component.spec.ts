import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EowDataComponent } from './eow-data.component';

describe('EowDataComponent', () => {
  let component: EowDataComponent;
  let fixture: ComponentFixture<EowDataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EowDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EowDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
