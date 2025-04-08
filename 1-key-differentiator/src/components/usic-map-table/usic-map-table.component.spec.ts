import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HereMapModule } from '../here-map/here-map.module';

import { UsicMapTableComponent } from './usic-map-table.component';

describe('UsicMapTableComponent', () => {
  let component: UsicMapTableComponent;
  let fixture: ComponentFixture<UsicMapTableComponent>;
  let router: Router;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ HereMapModule ],
      declarations: [ UsicMapTableComponent ],
      providers: [
        { provide: Router, useValue: router }
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UsicMapTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
