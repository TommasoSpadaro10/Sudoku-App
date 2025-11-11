import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SudokuComponent } from './sudoku.component';

describe('Sudoku', () => {
  let component: SudokuComponent;
  let fixture: ComponentFixture<SudokuComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SudokuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SudokuComponent)
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
