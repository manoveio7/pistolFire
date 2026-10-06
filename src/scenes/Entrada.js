// Entrada.js
export class Entrada extends Phaser.Scene {
    constructor() {
        super('Entrada');
        this.toco = false;
    }

    preload() {
        this.load.image('logo', './src/img/jebiyu.png');
        this.load.image('cajaCarga', './src/img/cajaCarga.png');
        this.load.image('barraCarga', './src/img/barraCarga.png');
    }

    create() {
        let camera = this.cameras.main;
        camera.backgroundColor = "rgb(0,0,0,1"
       // this.cam.background = 0x264493
        //camera.fadeIn(500, 0, 0, 0);
        
        this.logo = this.add.image(camera.width / 2, camera.height / 2, 'logo')
            .setDisplaySize(camera.width / 1.5, camera.width / 3)
            .setAlpha(1)
            .setScale(0.1)//0.2)
            
        this.tweens.add({
            targets: this.logo,
            duration: 1000,
            scale: 1,
            ease: 'Quad.easeOut',
            hold: 3000,
            yoyo: true,
            onComplete:()=>{
               a.play() 
               b.play()
               c.play()
            }
        })
        
        //algo para aprender de tweens
        let a = this.tweens.add({
              targets: this.logo,
               x: {
                    getStart: (target) => target.x,        // Posición actual al iniciar
                    getEnd: (target) => Math.random() * camera.width // Posición aleatoria al terminar
                },
                duration: 1000, 
                yoyo: true,
                loop: -1,
                paused: true
            });

        // Animar pos y del logo
        let miVariable = 10;

       let b = this.tweens.add({
           targets: { val: miVariable }, // Creamos un contenedor temporal
           val: { from: 10, to: 100 },
          duration: 1000,
          paused: true,
           onUpdate: (tween, target) => {
               miVariable = target.val; // Actualizamos la variable externa con el valor interpolado
             
           }
        });

        //Animar logo
       let c = this.tweens.add({
                targets: this.logo,
                duration: 3000,
                angle: 360*2,
                scale: 0.8,
                yoyo: true,
                loop: true,
                repeat: -1,
                delay: 1500,
                hold: 1500,
                ease: 'Back.easeInOut',
                paused: true
        });

    // fin animación del logo
 
    let textoIntro = this.add.text(camera.width/2,camera.height/1.2,'Toca la Pantalla!')
    .setFontFamily('Arial')
    .setFontSize(20)
    .setColor('White')
    .setOrigin(0.5).setAlpha(0);
    
        camera.fadeIn(1, 255, 255, 255);

        camera.once('camerafadeincomplete', () => {
            this.tweens.add({
                targets: textoIntro,
                duration: 500,
                alpha: 1,
                ease: 'Sine.easeInOut',
                repeat: -1,
                yoyo: true
            });

            this.input.on('pointerdown', () => {
                if (this.toco) return;
                this.toco = true;
                camera.fadeOut(1000, 0, 0, 0);
                camera.once('camerafadeoutcomplete', () => {
                    this.scene.start('Preloader');
                });
            });
        });
    }
}
