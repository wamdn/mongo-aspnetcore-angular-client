import { Component, OnInit } from '@angular/core';

import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Department } from '../shared/department.model';
import { Action } from '../shared/action.model';

@Component({
  selector: 'app-department',
  templateUrl: './department.component.html',
  styleUrls: ['./department.component.css']
})
export class DepartmentComponent implements OnInit {
  private readonly DEPT_URI = `${environment.API_URL}/departments`;

  public readonly Action = Action;

  public departments: Department[] = [];

  public action = Action.None;

  // department state
  public deptId?: string;
  public deptName?: string;

  // filer state
  public deptIdFilter = "";
  public deptNameFilter = "";
  public departmentsWithoutFilter: Department[] = []

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.refreshList();
  }

  public refreshList(): void {
    this.http
      .get(this.DEPT_URI)
      .subscribe(data => {
        this.departments = (data as Department[]);
        this.departmentsWithoutFilter = this.departments;
        this.filter()
      });
  }

  public setDeptState (dept: Department): boolean {
    this.deptId = dept.id;
    this.deptName = dept.name;
    return true;
  }

  public unsetDeptState (): boolean {
    this.deptId = "";
    this.deptName = "";
    return true;
  }

  public ationToString(action: Action): string {
    switch (action) {
      case Action.Create:
        return "Create"
      case Action.Update:
        return "Update"
      case Action.Delete:
        return "Delete"
      default:
        return ""
    }
  }

  public dispatcher(action: Action, dept: Department) {
    switch (action) {
      case Action.Create:
        this.create({ name: dept.name });
        break;
      case Action.Update:
        this.update(dept);
        break;
      case Action.Delete:
        this.delete({ id: dept.id });
        break;
    }
    this.unsetDeptState()
  }

  private create(dept: Department): void {
    this.http
      .post(this.DEPT_URI, dept)
      .subscribe(() => this.refreshList());
  }

  private update(dept: Department): void {
    this.http
      .put(this.DEPT_URI, dept)
      .subscribe(() => this.refreshList());
  }

  private delete(dept: Department): void {
    this.http
      .delete(`${this.DEPT_URI}/${dept.id}`)
      .subscribe(() => this.refreshList())
  }

  public filter() {
    const deptIdFilter = this.deptIdFilter.trim().toLowerCase();
    const deptNameFilter = this.deptNameFilter.trim().toLowerCase();

    this.departments = this.departmentsWithoutFilter.filter(dept =>
      dept.id?.includes(deptIdFilter) &&
      dept.name?.toLocaleLowerCase().includes(deptNameFilter))
  }

  public sort(prop: string, desc = false) {
    this.departments = this.departmentsWithoutFilter
      .sort((a: any, b: any): 1|0|-1 => {
        if (!desc) {
          return a[prop] > b[prop]
            ? 1
            : a[prop] < b[prop]
              ? -1
              : 0
        }
        return a[prop] < b[prop]
        ? 1
        : a[prop] > b[prop]
          ? -1
          : 0
      })
    this.filter()
  }

  public resetFilter(): void {
    this.deptIdFilter = "";
    this.deptNameFilter = "";
    this.filter();
  }
}
