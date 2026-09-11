/**
 * Admin bundle entry point.
 */

import { createRoot } from '@wordpress/element';
import App from './App';
import './style.scss';

const mount = document.getElementById( 'wooreels-admin-app' );

if ( mount ) {
	createRoot( mount ).render( <App /> );
}
