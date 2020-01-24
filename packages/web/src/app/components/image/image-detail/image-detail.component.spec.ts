import { TestBed } from '@angular/core/testing';
import { MatButtonModule, MatDialogModule, MatIconModule, MatChipsModule, MatTooltipModule } from '@angular/material';
import { ActivatedRoute, Params } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable } from 'rxjs/Observable';

import { ImageService } from '../image.service';
import { ImageDetailComponent } from './image-detail.component';

class ImageServiceMock {
  findOne(id: number) {
    return Observable.of({ results: { id: 1, size: 123, remotes: [{ available: true }] } });
  }
}

const ActivatedRouteMock = {
  params: {
    subscribe: (fn: (value: Params) => void) => fn({
      id: 1,
    }),
  },
};

describe('ImageDetailComponent', () => {
  let component: ImageDetailComponent;
  let imageService: ImageService;

  beforeEach((async () => {
    const module = await TestBed.configureTestingModule({
      providers: [
        ImageDetailComponent,
        { provide: ImageService, useClass: ImageServiceMock },
        { provide: ActivatedRoute, useValue: ActivatedRouteMock }
      ],
      imports: [
        MatDialogModule,
        MatIconModule,
        MatButtonModule,
        MatChipsModule,
        MatTooltipModule,
        RouterTestingModule.withRoutes([]),
      ]
    });

    component = module.get(ImageDetailComponent);
    imageService = TestBed.get(ImageService);
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getCleanDescription', () => {
    it('should remove the brackets', () => {
      const values = [
        ['amd64 (test)', 'amd64'],
        ['amd64', 'amd64'],
        ['ubuntu bionic 18.04 (release) (20180617)', 'ubuntu bionic 18.04']
      ];

      values.forEach(value => expect(component.getCleanDescription(value[0])).toBe(value[1]));
    });
  });
});
