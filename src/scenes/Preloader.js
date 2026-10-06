export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

preload() {
    	let camera = this.cameras.main;
	
	let cajaCarga = this.add.image(camera.width/2,camera.height/2,'cajaCarga').setScale(2,1.4);
	let barraCarga = this.add.image(camera.width/2,camera.height/2,'barraCarga').setScale(2,1.4);
	let txt = this.add.text(cajaCarga.x,cajaCarga.y).setFontFamily('Arial').setFontSize(40).setColor('#000000').setOrigin(0.5,0);
	
	this.load.on('progress',(valor) => {
		let ancho = Math.round(barraCarga.width * valor);
		barraCarga.setCrop(0,0,ancho,cajaCarga.height);
		txt.setText(Math.round(valor * 100)+'%');
		
		if(valor === 1)
			txt.setText('Listo!');
	});
        // Aquí cargarías tus imágenes (pistolas, fondo, balas)
        // this.load.image('pistola_roja', 'assets/red_gun.png');
        this.load.image('fondo','./src/img/fondo.png')
        this.load.image('cola','./src/img/cola3.png')
        this.load.image('blanco','./src/img/blanco.png')
        this.load.image('punto','./src/img/cola2.png')
        this.load.image('humo','./src/img/humo.png')
        this.load.image('boton','./src/img/boton.png')
        this.load.image('portada','./src/img/portada.png')
        this.load.image('pistola','./src/img/pistola3.png')
        this.load.image('brillo','./src/img/brillo.png')
        this.load.image('btn2jug','./src/img/2jug.png')
        this.load.image('btn1jug','./src/img/1jug.png')
        this.load.image('roca','./src/img/roca.png')
        
        this.load.spritesheet('bubble', './src/img/bubble.png', { frameWidth: 133.333333, frameHeight: 133.5 });
        this.load.spritesheet('escudo', './src/img/escudo.png', { frameWidth: 133.333333, frameHeight: 133.5 }); 
        this.load.spritesheet('bolaFuego', './src/img/fuego.png', { frameWidth: 512, frameHeight: 256 }); 
    
    
    // Aquí cargamos los audios
        this.load.audio('tiro', './sonidos/tiro2.mp3');
        this.load.audio('321', './sonidos/321.mp3');
        this.load.audio('golpe', './sonidos/golpe.mp3');
        this.load.audio('daño', './sonidos/daño.mp3');
        this.load.audio('explota', './sonidos/bomba.mp3');
        this.load.audio('win', './sonidos/win.wav');
        this.load.audio('play', './sonidos/play.wav');
        this.load.audio('mover', './sonidos/mover.ogg');
        this.load.audio('explotaBubble', './sonidos/explotaBubble.mp3');
        this.load.audio('vozYa', './sonidos/inicioDuelo.mp3');
        this.load.audio('musica', './sonidos/musica.mp3')//musica2.wav');

    }

    create() {
        this.time.delayedCall(1000, () => {
        this.cameras.main.fadeOut(1000,0,0,0);
	
    	this.cameras.main.once('camerafadeoutcomplete',() => {
		    
		        this.scene.start('Inicio');
		   
    	});
        });
    }
}
