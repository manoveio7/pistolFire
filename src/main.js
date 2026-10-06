
import { Entrada } from './scenes/Entrada.js';
import { Preloader } from './scenes/Preloader.js';
import { Inicio } from './scenes/Inicio.js';
import { GameScene } from './scenes/GameScene.js';

const config = {
    type: Phaser.AUTO,
    width: 500,
	height: 900,
  //  backgroundColor: '#333333', // Color oscuro como el video 186720.mp4
   scale: {
       mode: Phaser.Scale.FIT,
       autoCenter: Phaser.Scale.CENTER_BOTH 
   },
   
    physics: {
        default: 'matter', // AQUÍ suele dar el error si falta la coma arriba
        matter: {
            gravity: { y: 0.3},
            debug: false// Ponlo en true si quieres ver las cajas de colisión
        }
    },
    scene: [Entrada,Preloader,Inicio, GameScene]
};

new Phaser.Game(config);
