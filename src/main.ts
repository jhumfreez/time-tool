import 'zone.js/dist/zone';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { interval, map } from 'rxjs';
import { defaultFileName, download, msToHours, padNumber } from './utils';
import { TimeDataPayload } from './types';

@Component({
  selector: 'my-app',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="timeForm">
      <label for="endTime">Start Time</label>
      <input id="startTime" formControlName="startTime" type="time">
      <button (click)="setCurrentTime('startTime')">Set Current</button>

      <label for="endTime">End Time</label>
      <input id="endTime" formControlName="endTime" type="time">
      <button (click)="setCurrentTime('endTime')">Set Current</button>
      <!-- <button>Customize Export Data</button> -->
      <div>
        <label for="stubTitle">Named File Export? (Optional)</label>
        <input id="stubTitle" formControlName="stubTitle" [placeholder]="defaultFileName">
        <button (click)="insertDefaultTitle()">Insert Default</button>
        <button (click)="this.timeForm.controls.stubTitle.reset()">Clear</button>

        <label for="comments">Comments? (Optional)</label>
        <input class="comment-input" id="comments" formControlName="comments" placeholder="Meeting, Holiday, etc." maxLength="40">
        <button (click)="this.timeForm.controls.comments.reset()">Clear</button>
      </div>
    </form>
    <div *ngIf="time$|async as progress" class="progress-container">
      <p [ngClass]="{'progress-completed':progress===100}">Percent Completion: {{progress|number:'1.0-2'}}%<sup style="color:red">*Note: This is not currently accurate</sup></p>   
      <mat-progress-bar mode="determinate" [value]="progress"></mat-progress-bar>
    </div>
    <div class="btn-container">
      <button (click)="timeForm.reset()">Reset</button>
      <button (click)="onDownload()">Export Data</button>
    </div>
  `,
})
export class App {
  defaultStart = '09:00';
  defaultEnd = '17:00';
  timeForm: FormGroup;
  defaultFileName = defaultFileName();
  get currentTime() {
    const today = new Date();
    return `${padNumber(today.getHours())}:${padNumber(today.getMinutes())}`;
  }
  get startDate() {
    return this.dateFromTime(this.timeForm.controls.startTime?.value);
  }
  get endDate() {
    return this.dateFromTime(this.timeForm.controls.endTime?.value);
  }
  get progressComplete() {
    // Assumption: current time is within valid range
    const timeComplete = this.diffDates(this.startDate, new Date());
    const totalTimeDiff = this.diffDates(this.startDate, this.endDate);
    // FIXME: This is incorrect. Only works if end time > start time. Breaks when diff is 1 hour.
    const fractionComplete = timeComplete / (totalTimeDiff || 1);
    const percentComplete = (fractionComplete * 100).toFixed(2);
    // Don't need to display > 100%, just needs to note completion.
    return fractionComplete <= 1 ? percentComplete : 100;
  }
  get dateStamp() {
    // return new Date().toLocaleDateString().replaceAll('/','-');
    return new Date().toLocaleDateString().replace(/\//g, '-');
  }
  /*
    Note: This is a hack. <=1 sec intervals introduce change detection errors.
    Source appears to be in the material components. However, I think this is
    due to binding a value derived from a new date object, so every millisecond the bound data will change. Not sure why >1 secs is fine though...
    ¯\_(ツ)_/¯
  */
  time$ = interval(1001).pipe(map(() => this.progressComplete));

  constructor(private fb: FormBuilder) {
    this.timeForm = this.fb.group({
      startTime: this.fb.control(
        this.validDefault(this.defaultStart, true)
          ? this.defaultStart
          : this.currentTime,
        { nonNullable: true }
      ),
      endTime: this.fb.control(this.defaultEnd, { nonNullable: true }),
      // TODO: Consider making the file editing form section a FormGroup
      stubTitle: this.fb.control(null),
      comments: this.fb.control(null),
    });
  }

  validDefault(time: string, isStart: boolean) {
    const defaultDate = this.dateFromTime(time);
    return isStart
      ? this.diffDates(defaultDate, new Date()) > 0
      : this.diffDates(new Date(), defaultDate) > 0;
  }
  dateFromTime(time: string) {
    const today = new Date();
    return new Date(`${today.toDateString()} ${time}`);
  }
  // returns difference in ms
  diffDates(startDate: Date, endDate: Date) {
    return endDate.getTime() - startDate.getTime();
  }
  setCurrentTime(controlName: string) {
    this.timeForm.controls[controlName]?.setValue(this.currentTime);
  }
  insertDefaultTitle() {
    this.timeForm.controls.stubTitle.setValue(defaultFileName());
  }
  // TODO: Add validation and disable this option until form is valid.
  // TODO: Add drag n drop import
  onDownload() {
    const today = new Date();
    const timeDiff = msToHours(this.diffDates(this.startDate, this.endDate));
    // TODO: add type definition
    const payload: TimeDataPayload = {
      dateCreatedLocal: today.toLocaleString(),
      dateCreatedUTC: today.toISOString(),
      startTime: this.timeForm.controls.startTime.value,
      endTime: this.timeForm.controls.endTime.value,
      hoursLogged: timeDiff,
      comments: this.timeForm.controls.comments.value,
    };
    download(
      payload,
      this.timeForm.controls.stubTitle.value ?? defaultFileName()
    );
  }
}

bootstrapApplication(App);
