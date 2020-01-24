import { Component, EventEmitter, Output, Input } from '@angular/core';
import { MatSelectChange } from '@angular/material';
import * as API from '@lxdhub/interfaces';

@Component({
  selector: 'app-remote-select',
  template: `
<mat-select *ngIf="selected" placeholder="Select Remote" [value]="selected" (selectionChange)="onSelectionChange($event)">
  <mat-option *ngFor="let remote of remotes" [value]="remote">
    {{ remote.name }}
  </mat-option>
</mat-select>
  `,
  styleUrls: ['./remote-select.component.css']
})
/**
 * The component, which displays a remote-selection.
 */
export class RemoteSelectComponent {

  @Input() remotes: API.RemoteDto[];
  @Input() selected: API.RemoteDto;
  /**
   * The selected remote-event. Changes when the selected
   * remote changes.
   * @example
   * <app-remote-select (selected)="onRemoteChange($event)"></app-remote-select>
   */
  @Output() selectionChange = new EventEmitter<API.RemoteDto>();

  constructor(
  ) { }

  /**
   * Gets called when the selection of mat-select changes.
   * Emits the selected remote to the output.
   * @param event The change-event from mat-select
   */
  onSelectionChange(event: MatSelectChange) {
    const remote = event.value;
    this.selectionChange.emit(remote);
  }
}
