import { Injectable } from '@angular/core';

export interface CellValue {
  element: any;
  colName: string;
  type: string;
  linkUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class CellValue {}
