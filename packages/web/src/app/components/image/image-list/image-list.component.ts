import { Component, OnInit, OnDestroy } from '@angular/core';
import { PageEvent, MatSnackBar } from '@angular/material';
import * as API from '@lxdhub/interfaces';

import { ImageService } from '../image.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { RemoteService } from '../../remote/remote.service';

@Component({
  selector: 'app-image-list',
  template: `
<section class="layout-padding
  col-lg-8
  col-lg-offset-2
  col-md-10
  col-md-offset-1
  col-sm-10
  col-sm-offset-1
  col-xs-12
  col-xs-offset-0">
  <div class="center-xs middle-xs column layout-padding layout-margin" *ngIf="error">
    <span class="layout-margin">
    {{ error }}
    </span>
  </div>
  <div class="row" [ngClass]="{ 'search-bar': !!imageResponse }">
    <div class="col-xs-12 col-md-2">
      <app-remote-select (selectionChange)="onRemoteChange($event)" [remotes]="remotes" [selected]="selectedRemote"></app-remote-select>
    </div>
    <div class="col-xs-12 col-md-10">
      <app-image-search  *ngIf="imageResponse" [invalid]="invalidSearchQuery" (valueChange)="onQueryChange($event)"></app-image-search>
    </div>
  </div>
  <app-remote-hint [remote]="selectedRemote"></app-remote-hint>

  <table class="image-list" *ngIf="imageResponse">
    <thead>
      <tr>
        <th class="image-column">Image</th>
        <th>Fingerprint</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      <tr class="image-list-item"
          *ngFor="let image of imageResponse.results"
          [routerLink]="['/remote/' + selectedRemote.name + '/image/' + image.fingerprint]">
        <td class="image-column">{{ image.description }}</td>
        <td>{{ image.fingerprint }}</td>
        <td>{{ image.uploadedAt }}</td>
      </tr>
    </tbody>
  </table>
  <mat-paginator *ngIf="imageResponse"
  (page)="onPaginationChange($event)"
  [length]="imageResponse.total"
  [pageSize]="limit"
  [pageSizeOptions]="[5, 10, 25, 100]">
</mat-paginator>
</section>
  `,
  styleUrls: ['./image-list.component.css']
})
export class ImageListComponent implements OnInit, OnDestroy {

  /**
   * Initializes the ImageList Component
   * @param imageService The service to fetch images from the API interface
   */
  constructor(
    private imageService: ImageService,
    private route: ActivatedRoute,
    private router: Router,
    private remoteService: RemoteService,
    private snackbar: MatSnackBar) { }

  remoteNameSubscriber: Subscription;
  remotes: API.RemoteDto[];
  imageResponse: API.PaginationResponseDto<API.ImageListItemDto[]>;
  error: string;
  limit = 25;
  offset = 0;
  query = '';
  selectedRemoteName: string;
  selectedRemote: API.RemoteDto;
  invalidSearchQuery = false;

  /**
   * Subscribes to the id-Url-parameter and
   * loads the image, if it changes
   */
  async ngOnInit() {
    await this.loadRemotes();
    this.remoteNameSubscriber = this.route.params
      .subscribe(params => {
        this.selectedRemoteName = params.remoteId;
        this.updateSelectedRemote();
      });
  }

  /**
   * Loads all remotes from the API, binds them
   * to the controller and selected and emit
   * the first remote.
   */
  async loadRemotes(): Promise<API.ResponseDto<API.RemoteDto[]>> {
    try {
      const remoteResponse = await this.remoteService
        .findAll()
        .toPromise();
      this.remotes = remoteResponse.results;
      return remoteResponse;
    } catch (err) {
      this.onRemotesError();
    }
  }


  updateSelectedRemote() {
    const selectedRemote = this.remotes.find(remote => remote.name === this.selectedRemoteName);
    if (this.selectedRemoteName && !!selectedRemote) {
      this.onRemoteChange(selectedRemote, false);
    } else {
      this.onRemoteChange(this.remotes[0], true);
    }
  }
  /**
 * Gets called when there is an error
 * while fetching the remotes.
 */
  onRemotesError() {
    return this.snackbar
      .open('Could not fetch remotes', 'Retry')
      .onAction()
      .subscribe(() => this.loadRemotes());
  }
  /**
   * Unsubscribes to all obvervables
   */
  ngOnDestroy() {
    this.remoteNameSubscriber.unsubscribe();
  }

  /**
   * Gets called when a remote changes.
   * Binds the remote to the controller, resets the bound
   * `offset` to 0 and reloads loads the page
   * @param remote The remote, which got changed
   */
  onRemoteChange(remote: API.RemoteDto, replaceUrl?: boolean) {
    this.selectedRemote = remote;
    this.offset = 0;
    const url = `/remote/${this.selectedRemote.name}/images`;
    this.router.navigate([url], { replaceUrl });
    this.loadPage();
  }
  /**
   * Gets called when the pagination options change.
   * Sets the pagination options, depending on the given mat-paginatior event.
   * Then reloads the images.
   * @param event The material paginator event
   */
  onPaginationChange(event: PageEvent) {
    this.offset = event.pageSize * event.pageIndex;
    this.limit = event.pageSize;
    this.loadPage();
  }

  /**
   * Gets called when the search query changes.
   * Reloadds the images
   * @param query The query string
   */
  onQueryChange(query: string) {
    this.query = query;
    this.offset = 0;
    this.loadPage();
  }


  /**
   * Loads the page with the bound
   * options
   */
  loadPage() {
    return this.loadImages({
      limit: this.limit,
      offset: this.offset,
      remote: this.selectedRemote.name,
      query: this.query
    });
  }

  /**
   * Loads images with the given pagintaion options applied
   * @param pagination The pagination options which will be sent as query parameter to the server
   */
  private loadImages(pagination: API.PaginationOptionsDto & { remote: string, query: string }) {
    return this.imageService.findByRemote(pagination)
      .subscribe(
        data => {
          this.imageResponse = data;
          this.invalidSearchQuery = false;
        },
        err => {
          if (err.status === 400) {
            this.invalidSearchQuery = true;
          } else {
            this.error = 'Server is not reachable. Contact a server administrator.';
          }
        });
  }
}
