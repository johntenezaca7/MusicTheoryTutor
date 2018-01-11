import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import axios from 'axios';
import Accidental from './Accidental.jsx';
let chromatic = require('./chromatic.js').chromatic;

class Note extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			selected: false,
			chromaticIndex: undefined, // initialize to undefined - on componentWillMount, use name to lookup/set value.
			name: this.props.name
		}
		this.select = this.select.bind(this);
		this.getNextNote = this.getNextNote.bind(this);
		this.moveNote = this.moveNote.bind(this);
		this.getAccidental = this.getAccidental.bind(this);
		this.lookupChromaticIndex = this.lookupChromaticIndex.bind(this);
	}

	lookupChromaticIndex(noteName) {
		let result = null;
		chromatic.forEach((tuple, i) => {
			if ( tuple.indexOf(noteName) !== -1 ) {
				result = i;
			}
		});
		return result;
	}

	getAccidental(noteName) {
		// look for '#' or 'b' in the note name at index 1
		if ( noteName[1] === "#" ) {
			return "sharp";
		} else if ( noteName[1] === "b" ) {
				return "flat";
			}

		return "";
	}

	moveNote(direction) {
		if ( this.state.selected ) {
			let $child = $('#'+this.props.index);
			let $parent = $child.parent();
			if ( direction === "up" ) {
				// get div above $parent
				let $above = $parent.prev();
				// remove note/accidental from $parent and append to $above
				$child.remove();
				$above.append($child);
			}
			if ( direction === "down" ) {
				// get div below $parent
				let $below = $parent.next();
				// remove note/accidental from $parent and append to $below
				$child.remove();
				$below.append($child);
			}
		}
	}

	getNextNote(direction) {
		//////////////////////////////////////////////////////////////////////////////////////////
		// this function looks for the next note in the direction user clicks (up or down).
		//
		// if the next note has a different letter name (i.e. D# -> E ), it will trigger the note
		// to move to the next div.
		//
		// if the next note is a sharp or flat version of the same letter (i.e. D -> Db), it won't
		// trigger the note to move. 
		//////////////////////////////////////////////////////////////////////////////////////////
		let c = this.state.chromaticIndex;
		let n = this.state.name;
		if ( direction === 'up' && chromatic[c + 1] ) {
			let newNote = chromatic[c + 1][0]; // 0th index of tuple is the 'ascending' enharmonic spelling of the note.
			this.setState({
				chromaticIndex: c + 1,
				name: newNote
			});
			if ( n[0] !== newNote[0] ) {
				// note letter changed - note needs to move
				this.moveNote("up");
			}
			return newNote;
		} else if (direction === 'down' && chromatic[c - 1]) {
			let newNote = chromatic[c - 1][1]; // index 1 of tuple is the 'descending' enharmonic spelling of the note.
			this.setState({
				chromaticIndex: c - 1,
				name: newNote
			});
			if ( n[0] !== newNote[0] ) {
				// note letter changed - note needs to move.
				this.moveNote("down");
			}
			return newNote;
		} else {
			return null;
		}
	}

	select(e) {
			e.preventDefault();
			// toggle selected - if selected, color should be red, else black
			let s = this.state.selected;
			this.setState({
				selected: !s
			}, () => {
				// call function from index.jsx to update which note is selected in app state
				if ( this.state.selected ) {
					this.props.changeSelection(this.props.index, true);
				} else {
					this.props.changeSelection(this.props.index, false);
				}
			});
	}

	componentWillMount() {
		let i = this.lookupChromaticIndex(this.state.name);
		this.setState({
			chromaticIndex: i
		});
	}

	componentDidMount() { // have to use Didmount because I need to access dom elements.

		///////////////////////////////////////////////////
		// append note component to its initial parent div:
		///////////////////////////////////////////////////

		let n = this.props.name.toLowerCase();
		if ( n.length > 2 ) { // if note name contains an accidental
			n = n[0] + n[2]; // remove the accidental, which will always be at index 1 in the string.
		}
		let $parent = $('#' + n); // the div in grandStaff.jsx corresponding with name of note.
		let $child = $('#'+this.props.index); // the div that contains this note and its accidental.
		$parent.append($child);

		//////////////////////////////////////////////////
		// listen for note movement/deletion:
		///////////////////////////////////////////////////
		document.addEventListener("keydown", (e) => {
			// only fire events if note is selected.
			if ( this.state.selected ) {
				if ( e.which === 8 ) {
					// delete the note
					// $('#'+this.props.index).attr('style', {"display": "none"});
					// $('#'+this.props.index).remove();
					this.props.deleteNote(this.props.index);
				}
				let n = this.state.note;
				// console.log(n);
				if ( e.which === 38 ) {
					// console.log('move up a half step!');
					var nextNote = this.getNextNote('up');
					if ( nextNote !== null ) {
						this.props.changeNote(nextNote, this.props.index); // callback function from parent component updates parent state
					}
				} else if ( e.which === 40 ) {
					// console.log('move down a half step!');
					var nextNote = this.getNextNote('down');
					if ( nextNote !== null ) {
						this.props.changeNote(nextNote, this.props.index); // callback function from parent component updates parent state
					}
				}
					if ( nextNote !== undefined ) {
						this.setState({
							"note": nextNote
						});
					}
			}
		});
	}

	render() {
		return (
		<div className="noteAndAccidentalContainer" id={this.props.index} >
			<Accidental type={this.getAccidental(this.state.name)}/>
			<div onClick={this.select} className={!this.state.selected ? 'note' : 'activeNote'}></div>
		</div>
		);
	}
}

export default Note;