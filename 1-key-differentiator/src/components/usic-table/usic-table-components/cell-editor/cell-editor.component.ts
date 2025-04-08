import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UsicTableColumn } from 'projects/usic-lib/src/lib/models/general';

@Component({
  selector: 'app-cell-editor',
  templateUrl: './cell-editor.component.html',
  styleUrls: ['./cell-editor.component.scss']
})
export class CellEditorComponent implements OnInit {
  cellForm: UntypedFormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {column: UsicTableColumn; value: string}
    // private dialogRef: MatDialogRef<any>
  ) {
  }

  ngOnInit(): void {
    this.cellForm = new FormGroup({
      cell: new UntypedFormControl(this.data.value, Validators.required)
    });
    // this.dialogRef.afterClosed().subscribe(result => {
    //   console.log('closed', this.dialogRef.componentInstance.constructor.name, result.cell);
    // });

  }

}
