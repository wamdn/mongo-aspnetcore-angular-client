import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Department } from '../shared/department.model';
import { Action } from '../shared/action.model';
import { Employee } from './employee.model';

@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.css']
})
export class EmployeeComponent implements OnInit {
  private readonly DEPT_URI = `${environment.API_URL}/departments`;
  private readonly EMP_URI = `${environment.API_URL}/employees`;

  public readonly Action = Action;

  public departments: Department[] = [];
  public employees: Employee[] = [];

  public action = Action.None;

  // employee state
  public empId?: string;
  public empName?: string;
  public departmentId?: string;
  public departmentName?: string;
  public dateOfJoining?: Date;
  public imageName?: string;

  @ViewChild("fileInput")
  public fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild("dateInput")
  public dateInput?: ElementRef<HTMLInputElement>;

  public get employee() {
    return new Employee(
      this.empId,
      this.empName,
      this.departmentId,
      this.dateOfJoining,
      this.imageName
    )
  }

  // filer state
  public empIdFilter = "";
  public empNameFilter = "";
  public empDeptFilter = "";
  public empDOJFilter = "";
  public employeesWithoutFilter: Employee[] = []

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.refreshList();
  }

  public refreshList(): void {
    this.http
      .get(this.DEPT_URI)
      .subscribe(deptList => {
        this.departments = (deptList as Department[]);
        this.http
          .get(this.EMP_URI)
          .subscribe(empList => {
            this.employees = this.populateEmployees(<Employee[]>empList, this.departments);
            this.employeesWithoutFilter = this.employees;
            this.filter()
          });
      });
  }

  private populateEmployees(empList: Employee[], deptList: Department[]): Employee[] {
    const deptTable = new Map<string, string>();

    deptList.forEach((dept: Department) =>
      dept.id && dept.name && deptTable.set(dept.id, dept.name));

    empList.forEach(emp => {
      if (emp.departmentId && deptTable.has(emp.departmentId))
        emp.departmentName = deptTable.get(emp.departmentId)
    });

    return empList
  }

  public setEmpState (emp: Employee): boolean {
    this.empId = emp.id;
    this.empName = emp.name;
    this.departmentId = emp.departmentId;
    this.dateOfJoining = emp.dateOfJoining;
    this.imageName = emp.imageName;
    return true;
  }

  public unsetEmpState (): boolean {
    this.empId = "";
    this.empName = "";
    this.departmentId = "";
    this.dateOfJoining = new Date;
    this.imageName = "";
    if (this.fileInput)
      this.fileInput.nativeElement.value = "";
    return true;
  }

  public getImageSrc(imageName?: string): string {
    if (!imageName)
      return `${environment.PHOTO_URL}/anonymous.png`;

    return `${environment.PHOTO_URL}/${imageName}`;
  }

  public uploadFile(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (!fileList || fileList.length == 0) return;

    const file: File = fileList[0];
    const formData = new FormData();
    formData.append("photo", file);
    this.http
      .post(`${this.EMP_URI}/savefile`, formData)
      .subscribe(imageName => {
        this.imageName = imageName as string;
      });
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

  public dispatcher(action: Action, emp: Employee) {
    switch (action) {
      case Action.Create:
        this.create(emp);
        break;
      case Action.Update:
        this.update(emp);
        break;
      case Action.Delete:
        this.delete(emp);
        break;
    }
    setTimeout(() => this.unsetEmpState(), 1000)
  }

  private create(emp: Employee): void {
    this.http
      .post(this.EMP_URI, emp)
      .subscribe(() => this.refreshList());
  }

  private update(emp: Employee): void {
    this.http
      .put(this.EMP_URI, emp)
      .subscribe(() => this.refreshList());
  }

  private delete(emp: Employee): void {
    this.http
      .delete(`${this.EMP_URI}/${emp.id}`)
      .subscribe(() => this.refreshList())
  }

  public filter() {
    const empIdFilter = this.empIdFilter.trim().toLowerCase();
    const empNameFilter = this.empNameFilter.trim().toLowerCase();
    const empDeptFilter = this.empDeptFilter.trim().toLowerCase();
    const empDOJFilter = this.empDOJFilter.trim();

    this.employees = this.employeesWithoutFilter.filter(emp =>
      emp.id?.includes(empIdFilter) &&
      emp.name?.toLocaleLowerCase().includes(empNameFilter) &&
      emp.departmentName?.toLocaleLowerCase().includes(empDeptFilter) &&
      this.toLocaleDateString(emp.dateOfJoining).includes(empDOJFilter)
    )
  }

  public sort(prop: string, desc = false) {
    this.employees = this.employeesWithoutFilter
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
    this.empIdFilter = ""
    this.empNameFilter =""
    this.empDeptFilter = ""
    this.empDOJFilter = ""
    this.filter()
  }

  toLocaleDateString(date?: Date): string {
    if (date)
      return new Date(date).toLocaleDateString()

    return '';
  }
}
