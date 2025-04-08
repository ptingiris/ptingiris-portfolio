import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'lib-more-item',
  templateUrl: './more-item.component.html',
  styleUrls: ['./more-item.component.css']
})
export class MoreItemComponent implements OnInit {
  @Input() label = 'Default Label';
  @Output() clickItem = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  clickedMoreItem(event: MouseEvent) {
    this.clickItem.emit({event, label: this.label } );
  }

}
