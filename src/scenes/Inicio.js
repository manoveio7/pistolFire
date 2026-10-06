export class Inicio extends Phaser.Scene {
    constructor() {
        super('Inicio');
    }

    create() {
        let toco = false;
        
        this.play = this.sound.add('play');
        this.cameras.main.fadeIn(500, 0, 0, 0);
        this.add.image(0, 0, 'portada')
            .setOrigin(0)
            .setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        let b = this.add.image(this.cameras.main.width / 2, this.cameras.main.height - 185, 'btn1jug').setAlpha(1);
        let c = this.add.image(this.cameras.main.width / 2, this.cameras.main.height - 75, 'btn2jug').setAlpha(1);

        // Guardamos la animación de respiración base en una variable para poder detenerla al hacer clic
        let animacionRespiracion = this.tweens.add({
            targets: [b, c],
            duration: 500,
            alpha: 1,
            scaleX: 0.68,
            scaleY: 0.65,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // Configuración Botón 1 Jugador
        b.setScale(0.7).setInteractive().on('pointerup', () => {
            if (toco) return;
            toco = true;
            this.play.play();
            
            // Detener la animación de respiración para que no interfiera
            animacionRespiracion.stop();

            // Ejecutamos las transiciones personalizadas
            this.animarBotonSeleccionado(b, () => {
                this.scene.start('GameScene', { esModoUnJugador: true });
            });
            this.animarBotonNoSeleccionado(c);
        });

        // Configuración Botón 2 Jugadores
        c.setScale(0.7).setInteractive().on('pointerup', () => {
            if (toco) return;
            toco = true;
            this.play.play();
            
            // Detener la animación de respiración para que no interfiera
            animacionRespiracion.stop();

            // Ejecutamos las transiciones personalizadas
            this.animarBotonSeleccionado(c, () => {
                this.scene.start('GameScene', { esModoUnJugador: false });
            });
            this.animarBotonNoSeleccionado(b);
        });
    }
    
    // Anima el botón presionado haciendo que parpadee (pisque) rápido varias veces antes del cambio de escena
    animarBotonSeleccionado(boton, alTerminar) {
        this.tweens.add({
            targets: boton,
            alpha: 0,
            duration: 80,       // Velocidad del parpadeo
            repeat: 5,          // Cantidad de veces que va a piscar
            yoyo: true,         // Va y vuelve (visible / invisible)
            onComplete: () => {
                // Al terminar de parpadear, hacemos el Fade Out de la cámara
                this.cameras.main.fadeOut(800, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', alTerminar);
            }
        });
    }

    // Anima el botón que NO se tocó, haciendo que se desvanezca suavemente
    animarBotonNoSeleccionado(boton) {
        this.tweens.add({
            targets: boton,
            alpha: 0,
            scaleX: 0.4,        // Se encoge un poco mientras desaparece para dar más dinamismo
            scaleY: 0.4,
            duration: 500,      // Desaparece en medio segundo
            ease: 'Power2.easeOut'
        });
    }
}
