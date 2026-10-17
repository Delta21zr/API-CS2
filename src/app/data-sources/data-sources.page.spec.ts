import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { DataSourcesPage } from './data-sources.page';

describe('DataSourcesPage', () => {
  let component: DataSourcesPage;
  let fixture: ComponentFixture<DataSourcesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataSourcesPage],
      providers: [
        provideZonelessChangeDetection(),
        provideIonicAngular(),
        provideRouter([]),
        provideHttpClient()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DataSourcesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
