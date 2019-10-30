import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { ImageSearchComponent } from './image-search.component';

describe('ImageSearchComponent', () => {
  let component: ImageSearchComponent;

  beforeEach((async () => {
    const module = await TestBed.configureTestingModule({
      imports: [
        MatIconModule,
        FormsModule
      ],
      providers: [
        ImageSearchComponent
      ]
    });
    component = module.get(ImageSearchComponent);
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
