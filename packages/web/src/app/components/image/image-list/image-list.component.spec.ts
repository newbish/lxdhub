import { async, TestBed } from '@angular/core/testing';
import { Interfaces as API } from '@lxdhub/common';
import { of, Observable } from 'rxjs';

import { ImageService } from '../image.service';
import { ImageListComponent } from './image-list.component';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { RemoteService } from '../../remote/remote.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material';

const images: API.ImageListItemDto[] = [{
  fingerprint: '1',
  description: '1',
  id: 1,
  uploadedAt: new Date()
} as API.ImageListItemDto];

class MockImageService {
  findByRemote(options: API.ImageListOptions & { offset: number, limit: number }):
    Observable<API.PaginationResponseDto<API.ImageListItemDto[]>> {
    const imageResponse: any = {
      results: images,
      offset: options.offset,
      limit: options.limit,
      total: 1
    };
    return of(imageResponse);
  }
}


class MockRemoteService {
  findAll(): Observable<API.ResponseDto<API.RemoteDto[]>> {
    const response: API.ResponseDto<API.RemoteDto[]> = {
      results: [{
        name: 'test',
        serverUrl: '1',
        readonly: false,
        public: true,
        protocol: 'lxd',
        id: 1
      }]
    };
    return of(response);
  }
}


describe('ImageListComponent', () => {
  let component: ImageListComponent;
  let imageService: MockImageService;
  let remoteService: MockRemoteService;
  let router;
  const limit = 25;
  const offset = 0;
  const query = 'os=ubuntu';

  beforeEach((async () => {
    const module = await TestBed.configureTestingModule({
      imports: [
        MatSnackBarModule
      ],
      providers: [
        ImageListComponent,
        {
          provide: ImageService,
          useClass: MockImageService
        },
        {
          provide: ActivatedRoute,
          useValue: {
            params: {
              subscribe: (fn: (value: Params) => void) => fn({
                remoteId: 'test',
              }),
            },
          }
        }, {
          provide: Router,
          useValue: {
            navigate(params) { }
          }
        },
        {
          provide: RemoteService,
          useClass: MockRemoteService
        }
      ]
    });
    component = module.get(ImageListComponent);
    imageService = module.get(ImageService);
    remoteService = module.get(RemoteService);
    router = module.get(Router);
    // component = new ImageListComponent(imageService as ImageService, {} as ActivatedRoute);
    // component.limit = 25;
    // component.offset = 0;
    // component.remote = { id: 1, name: '', protocol: '', public: true, readonly: false, serverUrl: '' };
    // component.query = 'os=ubuntu';
  }));


  it('should create', () => {
    expect(component).toBeDefined();
  });

  beforeEach(() => {
    component.limit = limit;
    component.offset = offset;
    component.query = query;
  });

  describe('ngOnInit', () => {

    it('should load all remotes on init', async () => {
      spyOn(remoteService, 'findAll').and.callThrough();
      await component.ngOnInit();

      expect(component.selectedRemoteName).toBe('test');
      expect(component.selectedRemote.id).toBe(1);
      expect(component.selectedRemote.name).toBe('test');
      expect(remoteService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should request the images on init', async () => {
      spyOn(imageService, 'findByRemote').and.callThrough();
      await component.ngOnInit();

      expect(imageService.findByRemote).toHaveBeenCalledWith({ limit, query, offset, remote: 'test' });
    });
  });

  describe('onRemoteChange', () => {
    it('should navigate to the remote url', () => {
      spyOn(router, 'navigate').and.callThrough();
      spyOn(imageService, 'findByRemote').and.callThrough();
      component.offset = 10;
      component.onRemoteChange({ name: 'test' } as API.RemoteDto);
      expect(component.selectedRemote.name).toBe('test');
      expect(component.offset).toBe(0);
      expect(router.navigate).toHaveBeenCalledWith(['/remote/test/images'], { replaceUrl: undefined });
      expect(imageService.findByRemote).toHaveBeenCalledTimes(1);
    });
  });

});
