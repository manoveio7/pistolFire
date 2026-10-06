export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        // SUGERENCIAS PARA EL juego
        //Una Super bala que rebote por la pantalla 
        this.scoreP1 = 0;
        this.scoreP2 = 0;
        this.fin = false;
        this.permitirDisparo = false;
        this.esModoUnJugador = false;
        this.pensandoIA = false;
        this.precisionIA = 0.1; // 0.4 es fácil (margen grande), 0.1 es difícil (precisión casi perfecta)
        this.tempPrecision;
        this.pant;
        this.escudo;
        window.ruben = this;
        this.cantActivaEscudo = 2;
        this.cantActivaDiamante = 4;
        this.escudoListo = false;
        this.diamanteListo = false;
        this.cartelActivo = false;
    }
    
    init(data) {
        if (data && data.esModoUnJugador !== undefined)
                this.esModoUnJugador = data.esModoUnJugador;
    }
    
    create() {
        this.cartelActivo = false
        this.pensandoIA = false
        this.pant = {
            w: this.cameras.main.width,
            h: this.cameras.main.height
        }

        // --- SOLUCIÓN DEL ERROR: Declaramos width y height al principio de create() ---
        const { width, height } = this.cameras.main;

        this.cameras.main.fadeIn(500, 0, 0, 0);

        this.input.addPointer(2);
        this.fin = false;
        this.add.image(0, 0, 'fondo').setOrigin(0).setDisplaySize(this.cameras.main.width, this.cameras.main.height)
        
        // Crear escudo...
        this.escudo = this.add.sprite(200,400,'escudo',0)
        .setScale(1.1)
        .setDepth(10)
        .setVisible(false)
        .setTint(0xFFE800)//#FFE800
        
        //Crear bubbles...
        this.bubble = this.matter.add.sprite(300,400,'bubble',null, { 
            shape: 'circle',
            radius: 15
            }).setScale(0.5).setCircle(25).setVisible(false)
     
        this.bubble.setSensor(true); 
        this.bubble.setStatic(true); // O puedes dejarlo dinámico si quieres que se mueva con fuerzas
        this.bubble.label = 'bubble';
        this.bubble.body.ignoreGravity = true
        this.bubble.pos = {
            x: this.bubble.x,
            y: this.bubble.y}
            
        this.bubble.setCollisionGroup(-1); // O puedes usar:
        this.bubble.body.collisionFilter.category = 0; 
        this.bubble.body.collisionFilter.mask = 0;
            
        this.bubble.pos.x = Phaser.Math.Between(50,this.pant.w-50)
        this.bubble.pos.y = Phaser.Math.Between(50,this.pant.h-50)
         
        this.bubble.setPosition(this.bubble.pos.x,this.bubble.pos.y)
        
        if (!this.anims.exists('expBubble')) {
            this.anims.create({
        		key: 'expBubble',
        		frames: this.anims.generateFrameNumbers('bubble', {start:0,end:5}),
        		frameRate: 10,
        		//repeat: 10, 
        		hideOnComplete: true
        	});
        };
    	
        if (!this.anims.exists('expEscudo')) {
        	this.anims.create({
        		key: 'expEscudo',
        		frames: this.anims.generateFrameNumbers('escudo', {start:0,end:5}),
        		frameRate: 10,
        		onComplete: ()=>{
        		    this.escudo.setVisible(false);
        		},
        		hideOnComplete: true
        	});
        };
    	
    	let tb = Phaser.Math.Between(5,10)*1000
    	if (this.scoreP1 >= this.cantActivaEscudo || this.scoreP2 >= this.cantActivaEscudo) {
        	this.time.delayedCall(tb,()=>{
                this.bubble.setCollisionGroup(0);
                this.bubble.body.collisionFilter.category = 1;
                this.bubble.body.collisionFilter.mask = 1;
                
                this.bubble.setRotation(0)
                this.bubble.setVisible(true);
                this.bubble.setFrame(0)
                this.bubble.anim.play();
                
                // aparece escudo en pistolas
                this.escudo.setPosition(this.p1.visual.x,this.p1.visual.y)
        	});
    	}
    	
    	this.bubble.anim = this.tweens.add({
            targets: this.bubble,
            y: this.bubble.y+40, // Límite superior
            duration: 1000,
            yoyo: true,
            repeat: -1,
            paused: true,
            ease: 'Sine.easeInOut'
        });
    
        //Preparar audios...
        this.tiro = this.sound.add('tiro').setVolume(0.4);
        this.golpe = this.sound.add('golpe').setVolume(0.2);
        this.audio321 = this.sound.add('321').setVolume(0.9);
        this.daño = this.sound.add('daño').setVolume(0.6)
        this.explota = this.sound.add('explota')
        this.win = this.sound.add('win').setVolume(0.3)
        this.mover = this.sound.add('mover')
        this.explotaBubble = this.sound.add('explotaBubble')
        this.vozYa = this.sound.add('vozYa').setVolume(0.3)
       this.musica = this.sound.add('musica').setVolume(0.2).setLoop(true)
       
      
        // GRUPOS PARA EVITAR AUTO-COLISIÓN
        this.grupoP1 = this.matter.world.nextGroup(true);
        this.grupoP2 = this.matter.world.nextGroup(true);

        // Crear punto de referencia...
        this.punto1 = this.add.image(200, 300, 'punto').setAlpha(0)
        this.punto2 = this.add.image(200, 300, 'punto').setAlpha(0)

        // Creamos una textura blanca de 8x8 píxeles para las partículas
        if (!this.textures.exists('estela')) {
            let graphics = this.make.graphics({
                x: 0, y: 0, add: false
            });
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(0, 0, 8, 8);
            graphics.generateTexture('estela', 8, 8);
        }
    
        if (!this.textures.exists('diamante')) {
            let graphics = this.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0xffffff, 1);
            graphics.beginPath();
            graphics.moveTo(12, 0);
            graphics.lineTo(24, 12);
            graphics.lineTo(12, 24);
            graphics.lineTo(0, 12);
            graphics.closePath();
            graphics.fillPath();
            graphics.generateTexture('diamante', 24, 24);
        }
        
        this.fuegoAzul = [0xA6FBFF, 0x0093FF, 0x2C3EFF, 0x000DBD];
        this.fuegoRojo = [0xfacc22, 0xf89800, 0xf83600, 0x9f0404];
        
        // 2. CREACIÓN DE LOS DIAMANTES SENSITIVOS
        this.diamanteRojo = this.matter.add.image(30, height / 2, 'diamante', null, {
            isStatic: true,
            isSensor: true,
            label: 'diamante_P1'
        });
        this.diamanteRojo.setTint(0xff4444);
        
        this.diamanteAzul = this.matter.add.image(width - 30, height / 2, 'diamante', null, {
            isStatic: true,
            isSensor: true,
            label: 'diamante_P2'
        });
        this.diamanteAzul.setTint(0x00aaff);
        
        // Los diamantes solo se activan y muestran a partir de los 10 puntos
        if (this.scoreP1 >= this.cantActivaDiamante || this.scoreP2 >= this.cantActivaDiamante) {
            this.diamanteRojo.setVisible(true);
            this.diamanteAzul.setVisible(true);
            
            this.tweens.add({
                targets: [this.diamanteRojo, this.diamanteAzul],
                y: height / 2 + 150,
                duration: 2500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        } else {
            // Si no han llegado a 10 puntos, los escondemos y desactivamos sus cuerpos físicos
            this.diamanteRojo.setVisible(false);
            this.diamanteAzul.setVisible(false);
            this.diamanteRojo.body.collisionFilter.category = 0;
            this.diamanteAzul.body.collisionFilter.category = 0;
        }


        // 1. UI
        this.scoreText1 = this.add.text(width / 2-50, 50, `${this.scoreP1}`, {
            fontSize: '50px', fill: '#ffffff'
        }).setOrigin(0.5).setStroke('#00aaff', 7);

        this.scoreText2 = this.add.text(width / 2+50, 50, `${this.scoreP2}`, {
            fontSize: '50px', fill: '#ffffff'
        }).setOrigin(0.5).setStroke('#ff4444', 7);

        // 2. LÍMITES DEL MUNDO (Grosor masivo para evitar fugas)
        const wallOptions = {
            isStatic: true,
            restitution: 0.8,
            friction: 0.1
        };
        this.matter.add.rectangle(width / 2, height + 250, width * 2, 500, wallOptions);
        this.matter.add.rectangle(width / 2, -250, width * 2, 500, wallOptions);
        this.matter.add.rectangle(-250, height / 2, 500, height * 2, wallOptions);
        this.matter.add.rectangle(width + 250, height / 2, 500, height * 2, wallOptions);

        // 3. Crear Jugadores
        this.p1 = this.crearPistolaEstable(100, 300, 0x00aaff, 'P1', true, this.grupoP1);
        this.p2 = this.crearPistolaEstable(this.pant.w-100, 300, 0xff4444, 'P2', false, this.grupoP2);
        
        this.punto1.humo = this.crearParticula(this.punto1)
        this.punto2.humo = this.crearParticula(this.punto2)
        this.punto1.fuera = false
        this.punto2.fuera = false

        // 4. Controles
        this.input.on('pointerdown', (pointer) => {
            if (this.fin || !this.permitirDisparo) return;

            if (this.esModoUnJugador) {
                this.disparar(this.p1, this.grupoP1);
                this.punto1.humo.start()
                this.time.delayedCall(300, () => {
                    this.punto1.humo.stop()
                });
            }
            
           if(this.esModoUnJugador)
                return;
           
            if (pointer.x < width / 2) {
                this.disparar(this.p1, this.grupoP1);
                this.punto1.humo.start()
                this.time.delayedCall(300, () => {
                    this.punto1.humo.stop()
                });
            } else {
                this.disparar(this.p2, this.grupoP2);
                this.punto2.humo.start()
                this.time.delayedCall(300, () => {
                    this.punto2.humo.stop()
                });
            }
        });

        // 5. Colisiones
        this.matter.world.on('collisionstart', (event) => {
            if (this.fin) return;
          
            event.pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;

                const esBala = bodyA.label === 'bala' || bodyB.label === 'bala';
                const esSúperBala = bodyA.label === 'super_bala' || bodyB.label === 'super_bala';
                
                // Detectar colisión con diamantes
              // Detectar colisión con diamantes
                if (esBala) {
                    const cuerpoBala = bodyA.label === 'bala' ? bodyA : bodyB;
                    const cuerpoDiamante = bodyA.label.startsWith('diamante_') ? bodyA : (bodyB.label.startsWith('diamante_') ? bodyB : null);
                
                    if (cuerpoDiamante && cuerpoBala.propietario) {
                        
                        const diamanteVisual = cuerpoDiamante.gameObject;
                        this.limpiarBala(cuerpoBala); // Borramos la bala de inmediato
                
                        if (diamanteVisual) {
                            const colorOriginal = cuerpoDiamante.label === 'diamante_P1' ? 0xff4444 : 0x00aaff;
                            
                            this.reproducirSonidoCarga(); 
                            this.golpe.play(); 
                
                            // 1. TWEEN 1: Escala y parpadeo rápido (Flash)
                            this.tweens.add({
                                targets: diamanteVisual,
                                scale: 1.6,
                                duration: 100,
                                yoyo: true,
                                repeat: 4,
                                onStart: () => {
                                    cuerpoDiamante.isSensor = true; 
                                },
                                onUpdate: (tween) => {
                                    if (Math.floor(tween.progress * 10) % 2 === 0) {
                                        diamanteVisual.setTint(0xffffff);
                                    } else {
                                        diamanteVisual.setTint(colorOriginal);
                                    }
                                },
                                onComplete: () => {
                                    // 2. TWEEN 2: Temblor antes de estallar
                                    this.tweens.add({
                                        targets: diamanteVisual,
                                        x: diamanteVisual.x + Phaser.Math.Between(-5, 5),
                                        y: diamanteVisual.y + Phaser.Math.Between(-5, 5),
                                        duration: 50,
                                        yoyo: true,
                                        repeat: 3,
                                        onComplete: () => {
                                            diamanteVisual.setTint(colorOriginal);
                                            diamanteVisual.setScale(1);
                                            
                                            // --- AQUÍ ESTÁ EL CAMBIO DE LÓGICA ---
                                            // Forzamos el "dueño" de la súper bala según qué diamante se activó:
                                            // Si tocan el diamante de P1 (Rojo), el dueño pasa a ser P2 para que busque a P1.
                                            // Si tocan el diamante de P2 (Azul), el dueño pasa a ser P1 para que busque a P2.
                                            const dueñoSuperBala = (cuerpoDiamante.label === 'diamante_P1') ? 'P2' : 'P1';
                                            
                                            this.crearSuperBalaFuego(cuerpoDiamante.position.x, cuerpoDiamante.position.y, dueñoSuperBala);
                                        }
                                    });
                                }
                            });
                        }
                        return;
                    }
                }

                
     
            
            // Rebotes de la Súper Bala
                if (esSúperBala) {
                    const cuerpoSuper = bodyA.label === 'super_bala' ? bodyA : bodyB;
                    
                    // CORRECCIÓN: Comparamos de forma estricta para que 'super_bala' no se descarte a sí misma
                    const esPared = bodyA.label !== 'bala' && bodyB.label !== 'bala' && 
                                    !bodyA.label.includes('body') && !bodyB.label.includes('body') && 
                                    !bodyA.label.includes('diamante') && !bodyB.label.includes('diamante');
                
                    if (esPared) {
                        cuerpoSuper.rebotes = (cuerpoSuper.rebotes || 0) + 1;
                        this.golpe.play();
                
                        // Si llega a 4 rebotes se destruye
                        if (cuerpoSuper.rebotes >= 4) {
                            if (cuerpoSuper.emisorParticulas) cuerpoSuper.emisorParticulas.destroy();
                            if (cuerpoSuper.grafico) cuerpoSuper.grafico.destroy();
                            this.matter.world.remove(cuerpoSuper);
                            return; // Salimos para evitar procesar más código de un cuerpo destruído
                        }
                    }
                    
                    const p1 = bodyA.label === 'P1_body' ? this.p1 : (bodyB.label === 'P1_body' ? this.p1 : null);
                    const p2 = bodyA.label === 'P2_body' ? this.p2 : (bodyB.label === 'P2_body' ? this.p2 : null);
                    
                    if (p1 && cuerpoSuper.propietario === 'P2') {
                        this.gestionarImpacto(p1, 'P2', cuerpoSuper); 
                    } else if (p2 && cuerpoSuper.propietario === 'P1') {
                        this.gestionarImpacto(p2, 'P1', cuerpoSuper);
                    }
                }   

                const balaA = bodyA.label === 'bala' ? bodyA: null;
                const balaB = bodyB.label === 'bala' ? bodyB: null;
                const bala = balaA || balaB;

                const player1 = bodyA.label === 'P1_body' ? this.p1: (bodyB.label === 'P1_body' ? this.p1: null);
                const player2 = bodyA.label === 'P2_body' ? this.p2: (bodyB.label === 'P2_body' ? this.p2: null);
                
                const esBalaA = bodyA.label === 'bala';
                const esBalaB = bodyB.label === 'bala';
                const esBubbleA = bodyA.gameObject?.texture?.key === 'bubble' || bodyA.label === 'bubble';
                const esBubbleB = bodyB.gameObject?.texture?.key === 'bubble' || bodyB.label === 'bubble';
        
                if ((esBalaA && esBubbleB) || (esBalaB && esBubbleA)) {
                    const bla = esBalaA ? bodyA : bodyB;
                    this.impactoBubble(bla);
                }
    
                if (bala) {
                    if (balaA && balaB) {
                        this.golpe.play()
                        this.miniExplosionPared(balaA);
                        this.miniExplosionPared(balaB);
                        return;
                    }

                    if (player2)
                        this.gestionarImpacto(player2, 'P1', bala);
                    else if (player1)
                        this.gestionarImpacto(player1, 'P2', bala);
                    else {
                        this.miniExplosionPared(bala);
                    }
                }
            });
        });
        
        //prueba
        //this.mostrarVentanaDesbloqueo('ATENCION!',"¡Nuevo poder desbloqueado:\n Escudo activado!");
        //this.mostrarAvisoDesbloqueo("¡Nuevo poder desbloqueado:\n Escudo activado!");

        if(this.esModoUnJugador){
            if (this.scoreP1 === 0 || this.scoreP1 > this.tempPrecision) {
                this.precisionIA = Math.max(0.1, 0.4 - (this.scoreP1 * 0.025));
                this.tempPrecision = this.scoreP1
           }
            this.IA()
        }

        this.iniciarCuentaRegresiva()
        
        this.events.once('shutdown', () => {
            this.events.off('update');
            if (this.timerIA) {
                this.timerIA.destroy();
            }
        });
    }

        /**
     * Crea y muestra una ventana elegante de desbloqueo con bordes rojos,
     * fondo gradiente (amarillo arriba, blanco abajo), fuego detrás y un botón interactivo OK.
     */
    mostrarVentanaDesbloqueo(titulo, descripcion,ganador) {
        this.cartelActivo = true;
        
        const { width, height } = this.cameras.main;
        const centerX = width / 2;
        const centerY = height - 150;

        // Configuración de dimensiones de la ventana
        const winW = 340;
        const winH = 220; // Aumentamos un pelín el alto para acomodar el botón OK
        const cornerRadius = 15;
        const borderThickness = 6;

        // Pausamos temporalmente los disparos para que no haya caos mientras leen
        const disparoPrevio = this.permitirDisparo;
        this.permitirDisparo = false;

        // --- 1. FONDO DE FUEGO (Detrás de la ventana) ---
        const coloresFuego = this.fuegoRojo || [0xfacc22, 0xf89800, 0xf83600, 0x9f0404];
        
        let fuegoFondo = this.add.particles(centerX, centerY + (winH / 2) - 10, 'blanco', {
            color: coloresFuego,
            colorEase: 'quad.out',
            lifespan: { min: 1200, max: 3200 },
            angle: { min: -100, max: -80 }, 
            scale: { start: 2, end: 0, ease: 'sine.out' },
            speed: { min: 200, max: 300 },
            advance: 500, 
            frequency: 15,
            blendMode: 'ADD',
            x: { min: -winW / 2 + 20, max: winW / 2 - 20 }, 
            emitting: false
        }).setDepth(18);
        // --- 2. TEXTURA CANVAS DINÁMICA (Gradiente Amarillo -> Blanco) ---
        const keyTextura = 'fondoGradienteVentana';
        if (!this.textures.exists(keyTextura)) {
            const canvasTexture = this.textures.createCanvas(keyTextura, winW, winH);
            const ctx = canvasTexture.context;

            const gradiente = ctx.createLinearGradient(0, 0, 0, winH);
            gradiente.addColorStop(0, '#3E4747'); // Amarillo arriba
            gradiente.addColorStop(1, '#ffffff'); // Blanco abajo

            ctx.fillStyle = gradiente;
            ctx.beginPath();
            ctx.roundRect(0, 0, winW, winH, cornerRadius);
            ctx.fill();
            canvasTexture.refresh();
        }

        const fondoGradiente = this.add.image(centerX, centerY, keyTextura).setDepth(19);

        // Borde rojo elegante
        const bordeContorno = this.add.graphics().setDepth(19.5);
        bordeContorno.lineStyle(borderThickness, ganador === 'P1' ? 0x00aaff : 0xff4444, 1);
        bordeContorno.strokeRoundedRect(centerX - winW / 2, centerY - winH / 2, winW, winH, cornerRadius);

        // --- 3. TEXTOS ---
        const textTitulo = this.add.text(centerX, centerY - winH / 2 + 35, titulo, {
            fontFamily: 'Arial Black',
            fontSize: '30px',
            fill: ganador === 'P1' ? 0x00aaff : 0xff4444, 
            align: 'center'
        }).setOrigin(0.5).setDepth(20);
        textTitulo.setStroke('#ffffff', 6); 

        const textDesc = this.add.text(centerX, centerY - 10, descripcion, {
            fontFamily: 'Arial Black',
            fontSize: '15px',
            fill: '#000000', 
            align: 'center',
            wordWrap: { width: winW - 40 } 
        }).setOrigin(0.5).setDepth(20);
        textDesc.setStroke('#ffffff', 4);

        // --- 4. BOTÓN "OK" ELEGANTE E INTERACTIVO ---
        const btnW = 100;
        const btnH = 35;
        const btnX = centerX;
        const btnY = centerY + winH / 2 - 35;

        // Gráfico de fondo para el botón (Rojo brillante con bordes redondeados)
        const fondoBtn = this.add.graphics();
        fondoBtn.fillStyle(ganador === 'P1' ? 0x00aaff : 0xff4444, 1);
        fondoBtn.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        fondoBtn.lineStyle(2, 0xffffff, 1);
        fondoBtn.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);

        // Texto del botón
        const textoBtn = this.add.text(0, 0, 'OK', {
            fontFamily: 'Arial Black',
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Contenedor específico para el botón (facilita los efectos visuales al hacer clic)
        const botonOK = this.add.container(btnX, btnY, [fondoBtn, textoBtn])
            .setDepth(21)
            .setSize(btnW, btnH)
            .setInteractive({ useHandCursor: true });

        // --- 5. CONTENEDOR PRINCIPAL Y ANIMACIÓN ---
        const contenedorVentana = this.add.container(0, 0, [fondoGradiente, bordeContorno, textTitulo, textDesc, botonOK]).setDepth(20);
        
        contenedorVentana.setScale(0);
        this.tweens.add({
            targets: contenedorVentana,
            scale: 1,
            duration: 400,
            ease: 'Back.easeOut', 
            onStart: () => {
                if (this.mover) this.mover.play({ volume: 0.5 });
            },
            onComplete: () => {
                fuegoFondo.start();
            }
        });

        // --- 6. LÓGICA DE INTERACCIÓN (Cierre controlado) ---
        let yaCerrado = false;

        const cerrarVentana = () => {
            if (yaCerrado) return;
            yaCerrado = true;
            //this.permitirDisparo = true

            if (this.mover) this.mover.play({ volume: 0.5 });

            // Animación de salida tipo Pop-out
            this.tweens.add({
                targets: [contenedorVentana, fuegoFondo],
                scale: 0,
                alpha: 0,
                duration: 300,
                ease: 'Back.easeIn',
                onComplete: () => {
                    contenedorVentana.destroy();
                    fuegoFondo.destroy();
                    // Restauramos el estado del disparo al juego
                    this.permitirDisparo = disparoPrevio;
                    
                    this.cameras.main.fadeOut(500, 0, 0, 0);
                    this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.restart(); 
                    })
                }
            });
        };

        // Efectos del cursor sobre el botón OK
        botonOK.on('pointerdown', () => {
            this.tweens.add({ targets: botonOK, scale: 1.1, duration: 100 });
        });

        botonOK.on('pointerup', () => {
            this.tweens.add({ targets: botonOK, scale: 1.0, duration: 100,onComplete: cerrarVentana });
        });

        //botonOK.on('pointerup', cerrarVentana);
    }



    mostrarAvisoDesbloqueo(texto) {
        const { width, height } = this.cameras.main;
        const posY = 200;
        const posX = width / 2;

        // --- CORRECCIÓN AQUÍ: Unido 'configFuegoBase' sin espacios ---
        const configFuegoBase = {
            color: this.fuegoRojo,
            colorEase: 'quad.out',//'quad.out',
            lifespan: { min: 600, max: 1000 },
            angle: { min: -110, max: -70 }, // Llamas hacia arriba
            scale: { start: 0.7, end: 0, ease: 'quad.out' },
            speed: { min: 80, max: 150 },
            frequency: 20, // Frecuencia equilibrada para cada uno
            blendMode: 'ADD',
            x: { min: -60, max: 60 }, // Área horizontal más acotada por emisor
            y: { min: -5, max: 5 }
        };

        // 1. SISTEMA IZQUIERDO (Pasamos la variable corregida)
        const fuegoIzquierdo = this.add.particles(posX - 50, posY, 'blanco', configFuegoBase).setDepth(19);

        // 2. SISTEMA DERECHO (Pasamos la variable corregida)
        const fuegoDerecho = this.add.particles(posX + 50, posY, 'blanco', configFuegoBase).setDepth(19);

        // 3. TEXTO DEL AVISO
        const aviso = this.add.text(posX, posY-20, texto, {
            fontFamily: 'Arial Black',
            fontSize: '15px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5).setDepth(20);

        aviso.setStroke('#000000', 8);

        // 4. ANIMACIÓN SIMULTÁNEA (Tweens)
        this.tweens.add({
            targets: aviso,
            scale: 1.5,
            duration: 6000,
            ease: 'Quad.easeOut',
            onComplete: () => aviso.destroy()
        });

        // Animación de los dos sistemas de fuego en paralelo
        this.tweens.add({
            targets: [fuegoIzquierdo, fuegoDerecho],
            scale: 2,
            duration: 6000,
            ease: 'Quad.easeOut',
        /*    onUpdate: (tween) => {
                // Al avanzar la animación, apagamos gradualmente ambos fuegos
                if (tween.progress > 0.6) {
                    fuegoIzquierdo.setFrequency(-1);
                    fuegoDerecho.setFrequency(-1);
                }
            },*/
            onComplete: () => {
                fuegoIzquierdo.destroy();
                fuegoDerecho.destroy();
            }
        });
    }

    crearSuperBalaFuego(x, y, dueño) {
    this.explota.play();

    // 1. Identificar quién es el objetivo (la pistola enemiga)
    const objetivo = dueño === 'P1' ? this.p2 : this.p1;
    
    // Si por alguna razón el enemigo no existe, usamos una velocidad por defecto
    let velX = dueño === 'P1' ? 12 : -12;
    let velY = 0;

    if (objetivo && objetivo.body) {
        // 2. Calcular la distancia en X e Y hacia la posición actual de la pistola enemiga
        const dx = objetivo.body.position.x - x;
        const dy = objetivo.body.position.y - y;

        // 3. Obtener el ángulo exacto hacia ese punto
        const anguloHaciaEnemigo = Math.atan2(dy, dx);

        // 4. Descomponer la velocidad constante (ej. 14) en sus componentes X e Y usando el ángulo
        const velocidadConstante = 8; // Un poco más rápida que una bala normal
        velX = Math.cos(anguloHaciaEnemigo) * velocidadConstante;
        velY = Math.sin(anguloHaciaEnemigo) * velocidadConstante;
    }

    const colorFuego = dueño === 'P1' ? this.fuegoAzul : this.fuegoRojo;

    const superBala = this.matter.add.circle(x, y, 12, {
        restitution: 1,
        friction: 0,
        frictionAir: 0,
        label: 'super_bala',
        ignoreGravity: true,
        bullet: true
    });

    superBala.rebotes = 0;
    superBala.propietario = dueño;

    // 5. Aplicamos la velocidad calculada apuntando al rival
    this.matter.body.setVelocity(superBala, { x: velX, y: velY });

    // (El resto de tu código de partículas, gráficos y actualización se queda exactamente IGUAL...)
    const visualBala = this.add.circle(x, y, 12, 0xffffff, 0);
   
    const particles = this.add.particles(0, 0, 'blanco', {
        color: colorFuego,
        colorEase: 'quad.out',
        lifespan: 600,
        angle: { min: 0, max: 360 },
        scale: { start: 0.8, end: 0, ease: 'Quad.easeOut' },
        speed: 40,
        frequency: 15,
        follow: visualBala,
        blendMode: 'ADD'
    });

    superBala.emisorParticulas = particles;
    superBala.grafico = visualBala;

    const updateSuper = () => {
        if (visualBala.active && superBala.position) {
            visualBala.setPosition(superBala.position.x, superBala.position.y);
        }
    };
    this.events.on('update', updateSuper);

    this.time.delayedCall(8000, () => {
        this.events.off('update', updateSuper);
        if (particles) particles.destroy();
        if (visualBala) visualBala.destroy();
        if (this.matter.world.localWorld.bodies.includes(superBala)) {
            this.matter.world.remove(superBala);
        }
    });
}


    impactoBubble(bala) {
        if(!this.bubble.visible) return
   
        this.bubble.anim.paused = true;
        this.bubble.setCollisionGroup(-1);
        this.bubble.body.collisionFilter.category = 0; 
        this.bubble.body.collisionFilter.mask = 0;
            
        this.bubble.anims.play('expBubble');
        this.explotaBubble.play();
        
        const dueño = bala.propietario; 
        
        this.bubble.on(Phaser.Animations.Events.ANIMATION_COMPLETE, ()=> {
            this.bubble.setVisible(false);
            
            if(this.fin)
                return
            
            let pGuia = dueño === 'P1'? this.p1.visual : this.p2.visual;
            this.escudo.setPosition(pGuia.x,pGuia.y)
            this.escudo.setVisible(true)
            this.escudo.setFrame(0)

            if(dueño === 'P1') {
                this.p1.conEscudo = true
                this.p2.conEscudo = false
            } else {
                this.p2.conEscudo = true
                this.p1.conEscudo = false
            }
            
            this.sp = () => {
                if(this.fin && !this.escudo.visible){
                    this.events.off('update',this.sp)
                    return
                }
                
                if(this.escudo.visible)
                    this.escudo.setPosition(pGuia.x,pGuia.y)
            };
              
            this.events.on('update',this.sp)
        });

        this.bubble.volver = ()=>{
            let t = Phaser.Math.Between(10,20)*1000
            this.time.delayedCall(t, () => {
                this.bubble.pos.x = Phaser.Math.Between(50,this.pant.w-50)
                this.bubble.pos.y = Phaser.Math.Between(50,this.pant.h-50)
             
                this.bubble.setPosition(this.bubble.pos.x,this.bubble.pos.y)
                this.bubble.setCollisionGroup(0);
                this.bubble.body.collisionFilter.category = 1;
                this.bubble.body.collisionFilter.mask = 1;
                this.bubble.setRotation(0)
                this.bubble.setVisible(true);
                this.bubble.setFrame(0)
                this.bubble.anim.play();
            });
        }
    }

    crearPistolaEstable(x, y, color, label, mirarIzquierda = false, grupo) {
        const gunBody = this.matter.add.rectangle(x, y, 70, 45, {
            restitution: 0.5,
            frictionAir: 0.009,
            label: `${label}_body`,
            mass: 1,
            collisionFilter: { group: grupo }
        });

        const sprite = this.add.sprite(x, y, 'pistola');
        sprite.setDepth(3).setScale(0.4);

        if (mirarIzquierda) {
            sprite.flipX = true;
            sprite.setTint(0x00aaff)
        } else sprite.setTint(0xff4444)

        let ev = ()=>{
            if (gunBody && gunBody.position && sprite && sprite.active) {
                sprite.setPosition(gunBody.position.x, gunBody.position.y);
                sprite.setRotation(gunBody.angle);
            }

            const actualizarHumo = (pistola, punto) => {
                if (!pistola || !pistola.body) return;
                const puntaPistola = pistola.mirarIzquierda ? -100: 100;
                let matrix = pistola.visual.getWorldTransformMatrix();
                let posGlobal = matrix.transformPoint(puntaPistola, -30);
                punto.setPosition(posGlobal.x, posGlobal.y);
            }

            actualizarHumo(this.p1, this.punto1);
            actualizarHumo(this.p2, this.punto2);
        }
   
        this.events.on('update',ev);

        return {
            body: gunBody,
            visual: sprite,
            color: color,
            conEscudo: false,
            health: 2,
            mirarIzquierda: mirarIzquierda
        };
    }

    disparar(pistola, grupo) {
        if (!pistola.body || !this.permitirDisparo) return;
        this.tiro.play();

        const angle = pistola.body.angle;
        const factorDireccion = pistola.mirarIzquierda ? -1: 1;

        this.matter.applyForce(pistola.body, {
            x: -Math.cos(angle) * 0.01 * factorDireccion,
            y: -Math.sin(angle) * 0.01 - 0.02
        });

        const intentaIzquierda = Math.cos(angle) < 0;
        let direccionGiro = intentaIzquierda ? 1: -1;
        if (pistola.mirarIzquierda) direccionGiro *= -1;

        const intensidadGiro = 0.12;
        this.matter.body.setAngularVelocity(pistola.body, direccionGiro * intensidadGiro);

        const distanciaPunta = pistola.mirarIzquierda ? -50: 50;
        const bx = pistola.body.position.x + Math.cos(angle) * distanciaPunta - Math.sin(angle) * (-10);
        const by = pistola.body.position.y + Math.sin(angle) * distanciaPunta + Math.cos(angle) * (-10);

        const destelloEstatico = this.add.image(bx, by, 'cola')
        .setScale(1.5)
        .setDepth(2)
        .setBlendMode('ADD')
        .setAngle(pistola.mirarIzquierda ? Phaser.Math.RadToDeg(angle) + 180: Phaser.Math.RadToDeg(angle));

        this.tweens.add({
            targets: destelloEstatico,
            alpha: 0,
            duration: 300,
            onComplete: () => { destelloEstatico.destroy(); }
        });

        const bala = this.matter.add.circle(bx, by, 5, {
            restitution: 0.8,
            label: 'bala',
            ignoreGravity: true,
            isSensor: true,
            angle: angle,
            collisionFilter: { group: grupo }
        });
        
        bala.propietario = (grupo === this.grupoP1) ? 'P1' : 'P2';

        const bulletSpeed = 15 * factorDireccion;
        this.matter.body.setVelocity(bala, {
            x: Math.cos(angle) * bulletSpeed,
            y: Math.sin(angle) * bulletSpeed
        });

        const vBala = this.add.circle(bx, by, 7, 'rgb(0,0,0,0');

        const particles = this.add.particles(0, 0, 'cola', {
            speed: 0,
            quantity: 10,
            lifespan: 200,
            scale: { start: 0.1, end: 0 },
            alpha: { start: 0.6, end: 0 },
            tint: 0xaaffff,
            blendMode: 'ADD',
            frequency: 1,
            follow: vBala
        });

        bala.pistasParticulas = particles;
        bala.graficoCirculo = vBala;

        const updateBala = () => {
            if (vBala.active && bala.position) {
                vBala.setPosition(bala.position.x, bala.position.y);
            }
        };
        this.events.on('update', updateBala);

        this.time.delayedCall(3000, () => {
            this.events.off('update', updateBala);
            this.matter.world.remove(bala);
            vBala.destroy();
            particles.stop();
            this.time.delayedCall(400, () => { particles.destroy(); });
        });
    }

    destruirBala(balaBody) {
        if (balaBody && balaBody.gameObject) {
            balaBody.gameObject.destroy();
        }
        this.matter.world.remove(balaBody);
    }

    explotarArma(pistola, ganador) {
        this.fin = true;
        this.explota.play()
         this.musica.stop()
        
        this.cameras.main.shake(300, 0.05);

        let pos = pistola.visual.getWorldTransformMatrix();

        const explotar = this.add.particles(pos.tx, pos.ty-30, 'cola', {
            angle: { min: 0, max: 360 },
            speed: { min: 50, max: 200 },
            quantity: 20,
            lifespan: 1500,
            scale: { start: 0.7, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: 0xffaa44,
            blendMode: 'ADD',
            emitting: false
        });

        explotar.explode();
        explotar.setDepth(11)

        this.piezasSueltas = [];
        this.matter.world.engine.timing.timeScale = 0.2; 
        this.time.timeScale = 0.2; 

        this.time.delayedCall(300, () => {
            this.matter.world.engine.timing.timeScale = 1; 
            this.time.timeScale = 1; 
            this.tweens.timeScale = 1; 

            if (this.piezasSueltas) {
                this.piezasSueltas.forEach(pieza => {
                    if (pieza && pieza.body) {
                        this.matter.body.setVelocity(pieza, {
                            x: pieza.velocity.x,
                            y: 15 
                        });
                        this.matter.body.setMass(pieza, 5);
                    }
                });
            }
        });

        const { x, y } =  pistola.body.position; 
        const angle = pistola.body.angle; 

        this.matter.world.remove(pistola.body); 
        pistola.visual.destroy(); 

        const piezas = [
            { w: 70, h: 25, ox: 0, oy: 0 },
            { w: 13, h: 10, ox: 35, oy: 0 },
            { w: 20, h: 25, ox: -10, oy: 20 }
        ]; 

        piezas.forEach(p => {
            const rotadoX = p.ox * Math.cos(angle) - p.oy * Math.sin(angle); 
            const rotadoY = p.ox * Math.sin(angle) + p.oy * Math.cos(angle); 

            const piezaFisica = this.matter.add.rectangle(x + rotadoX, y + rotadoY, p.w, p.h, {
                restitution: 0.6,
                frictionAir: 0.01,
                mass: 1 
            });

            this.piezasSueltas.push(piezaFisica);

            const piezaVisual = this.add.rectangle(x + rotadoX, y + rotadoY, p.w, p.h, pistola.color); 
            piezaVisual.setRotation(angle); 

            const updatePieza = () => {
                if (piezaFisica.position && piezaVisual.active) {
                    piezaVisual.setPosition(piezaFisica.position.x, piezaFisica.position.y); 
                    piezaVisual.setRotation(piezaFisica.angle); 
                }
            };
            this.events.on('update', updatePieza); 

            this.matter.applyForce(piezaFisica, {
                x: (Math.random() - 0.5) * 0.15, 
                y: -0.2 
            });

            this.matter.body.setAngularVelocity(piezaFisica, (Math.random() - 0.5) * 0.2); 

            this.time.delayedCall(8000, () => {
                this.events.off('update', updatePieza); 
                this.matter.world.remove(piezaFisica); 
                piezaVisual.destroy(); 
            });
        });

        const { width, height } = this.cameras.main; 

        this.time.delayedCall(200, () => {
            this.tweens.timeScale = 1.0; 
            const objetoGanador = ganador === 'P1' ? this.p1: this.p2; 
            let g = null;

            if (ganador === 'P1') {
                this.scoreP1++;
                g = 1
            } else {
                this.scoreP2++;
                g = 2
            }

            if (objetoGanador && objetoGanador.body && objetoGanador.visual) {
                objetoGanador.body.ignoreGravity = true; 
                objetoGanador.body.isSensor = true; 

                this.matter.body.setVelocity(objetoGanador.body, { x: 0, y: 0 }); 
                this.matter.body.setAngularVelocity(objetoGanador.body, 0); 

                this.time.delayedCall(600, () => {this.mover.play(); });

                let cam = this.cameras.main
              
              if(objetoGanador.conEscudo) {
                    this.escudo.anims.play('expEscudo')
                    this.explotaBubble.play();
                    let aE = this.anims.get('expEscudo').duration;
                
                    this.time.delayedCall(aE,()=>{
                        // this.escudo.setVisible(false)
                         objetoGanador.conEscudo = false
                    })
                    
                }
           

                let brillo = this.add.image(cam.width/2-20, cam.height/2-70, 'brillo')
                .setScale(0)
                .setAlpha(0)
                
                this.tweens.add({
                    targets: objetoGanador.visual, 
                    x: width / 2, 
                    y: height / 2 - 50, 
                    angle: 360, 
                    scale: 1.3, 
                    alpha: 1, 
                    duration: 2000, 
                    ease: 'Back.easeInOut', 
                    onUpdate: () => {
                        if (objetoGanador.body) {
                            this.matter.body.setPosition(objetoGanador.body, {
                                x: objetoGanador.visual.x, y: objetoGanador.visual.y 
                            });
                             // this.escudo.setPosition(objetoGanador.visual.x,objetoGanador.visual.y)
                            this.matter.body.setAngle(objetoGanador.body, objetoGanador.visual.rotation); 
                        }
                    },
                    onComplete: () => {
                        if(this.bubble.visible){
                          this.bubble.anims.play('expBubble');
                            this.explotaBubble.play()
                        }
                    
                        this.tweens.add({
                            targets: brillo,
                            duration: 3000,
                            angle: 360,
                            repeat: -1
                        })

                        this.tweens.add({
                            targets: brillo,
                            duration: 300,
                            alpha: 1,
                            scale: 0.4,
                            ease: 'Quad.easeOut'
                        })

                        this.tweens.add({
                            targets: g === 1 ? this.scoreText1: this.scoreText2,
                            duration: 1000,
                            scale: 3,
                            y: 100,
                            yoyo: true,
                            onYoyo: ()=> {
                                if (g === 1) this.scoreText1.setText(this.scoreP1);
                                else this.scoreText2.setText(this.scoreP2);
                                 this.win.play(); 
                                                            // Comprobamos si el escudo o los diamantes deben desbloquearse según la puntuación
                                if (this.scoreP1 === this.cantActivaEscudo || this.scoreP2 === this.cantActivaEscudo) {
                                    if(!this.escudoListo)
                                    {
                                     this.mostrarVentanaDesbloqueo('¡ANTENCION!',"¡Nuevo poder desbloqueado:\n Escudo activado!", ganador);
                                     this.escudoListo = true
                                    }
                                }
                                if (this.scoreP1 === this.cantActivaDiamante || this.scoreP2 === this.cantActivaDiamante) {
                                   if(!this.diamanteListo)
                                   {
                                    this.mostrarVentanaDesbloqueo('¡ANTENCION!',"¡Diamantes y Súper Bala\n listos para el combate!",ganador);
                                    this.diamanteListo = true
                                   }
                                }
                                
                                 if(this.cartelActivo) 
                                    return
                                
                                this.time.delayedCall(3000, () => {
                                    this.cameras.main.fadeOut(500, 0, 0, 0);
                                    this.cameras.main.once('camerafadeoutcomplete', () => {
                                        this.scene.restart(); 
                                    });
                                });
                            },
                            ease: 'Back.easeOut'
                        })
                        
                    /*    if(this.cartelActivo) 
                            return
                        
                        this.time.delayedCall(5000, () => {
                            this.cameras.main.fadeOut(500, 0, 0, 0);
                            this.cameras.main.once('camerafadeoutcomplete', () => {
                                this.scene.restart(); 
                            });
                        });*/
                        console.log('¡Animación de victoria completada con éxito!'); 
                    }
                });
            }
        });
    }
    
    limpiarBala(bala) {
        if (!bala) return;
        if (bala.pistasParticulas) bala.pistasParticulas.destroy();
        if (bala.graficoCirculo) bala.graficoCirculo.destroy();
        if (bala.gameObject) bala.gameObject.destroy();
        
        if (this.matter.world.localWorld.bodies.includes(bala)) {
            this.matter.world.remove(bala);
        }
    }

    gestionarImpacto(pistolaRecibe, idGanador, cuerpoBala) {
        if (!cuerpoBala || !cuerpoBala.position || !this.matter.world.localWorld.bodies.includes(cuerpoBala)) {
            return;
        }

        const velocidadBalaX = (cuerpoBala && cuerpoBala.velocity) ? cuerpoBala.velocity.x: 0;
        const velocidadBalaY = (cuerpoBala && cuerpoBala.velocity) ? cuerpoBala.velocity.y: 0;
      
        if (cuerpoBala.pistasParticulas) cuerpoBala.pistasParticulas.destroy();
        if (cuerpoBala.graficoCirculo) cuerpoBala.graficoCirculo.destroy();
        if (cuerpoBala.emisorParticulas) cuerpoBala.emisorParticulas.destroy();
        if (cuerpoBala.grafico) cuerpoBala.grafico.destroy();
        if (cuerpoBala.gameObject) cuerpoBala.gameObject.destroy();
        
        if (this.matter.world.localWorld.bodies.includes(cuerpoBala)) {
            this.matter.world.remove(cuerpoBala);
        }
        
        if(!pistolaRecibe.conEscudo)
             pistolaRecibe.health--;
        else {
            this.escudo.anims.play('expEscudo');
            this.explotaBubble.play();
            let aE = this.anims.get('expEscudo');
            let d = aE.duration;
            
            this.time.delayedCall(d,()=>{
                 this.events.off('update',this.sp)
            })
           
            pistolaRecibe.conEscudo = false
            this.bubble.volver()
        }

        if (pistolaRecibe.health > 0) {
            this.daño.play();

            const nuevaVelX = pistolaRecibe.body.velocity.x + (velocidadBalaX * 0.5);
            const nuevaVelY = pistolaRecibe.body.velocity.y + (velocidadBalaY * 0.5);

            this.matter.body.setVelocity(pistolaRecibe.body, {
                x: nuevaVelX, y: nuevaVelY
            });

            this.matter.body.applyForce(pistolaRecibe.body, pistolaRecibe.body.position, {
                x: 0, y: -0.02
            });

            this.tweens.add({
                targets: pistolaRecibe.visual,
                alpha: 0,
                duration: 100,
                yoyo: true,
                repeat: 7
            });

        } else {
            const todasLasBalas = this.matter.world.localWorld.bodies.filter(b => b.label === 'bala');
            todasLasBalas.forEach(b => this.limpiarBala(b));
            
            const todasLasSuperBalas = this.matter.world.localWorld.bodies.filter(b => b.label === 'super_bala');
                todasLasSuperBalas.forEach(b => {
                    if (b.emisorParticulas) b.emisorParticulas.destroy();
                    if (b.grafico) b.grafico.destroy();
                    this.matter.world.remove(b);
                });
        
            this.punto1.fuera = true;
            this.punto1.humo.stop();
            this.punto2.fuera = true;
            this.punto2.humo.stop();
            this.explotarArma(pistolaRecibe, idGanador);
        }
    }

    miniExplosionPared(cuerpoBala) {
        if (!cuerpoBala || !cuerpoBala.position) return;

        const bx = cuerpoBala.position.x;
        const by = cuerpoBala.position.y;

        if (cuerpoBala.pistasParticulas) cuerpoBala.pistasParticulas.destroy();
        if (cuerpoBala.graficoCirculo) cuerpoBala.graficoCirculo.destroy();
        if (cuerpoBala.gameObject) cuerpoBala.gameObject.destroy();
        this.matter.world.remove(cuerpoBala);

        this.golpe.play()

        const chispas = this.add.particles(bx, by, 'cola', {
            angle: { min: 0, max: 360 },
            speed: { min: 50, max: 200 },
            quantity: 8,
            lifespan: 150,
            scale: { start: 0.7, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: 0xffaa44,
            blendMode: 'ADD',
            emitting: false
        });

        chispas.explode();

        this.time.delayedCall(200, () => { chispas.destroy(); });
    }


    crearParticula(pistola) {
        const humo = this.add.particles(0, 0, 'humo', {
            speed: { min: 5, max: 20 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.2, end: 0.5 },
            alpha: { start: 0.2, end: 0 },
            lifespan: 3000,
            quantity: 3,
            frequency: 30,
            emitting: false,
            particleSpace: 'world',
            follow: pistola
        });

        humo.setDepth(1)
        return humo
    }

      iniciarCuentaRegresiva() {
        const { width, height } = this.cameras.main;
        this.permitirDisparo = false;
        this.vozYa.play();

        // Texto inicial de la cuenta regresiva
        const textoCuenta = this.add.text(width / 2, height / 2 - 50, '1', {
            fontFamily: 'Arial Black',
            fontSize: '80px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(20);

        textoCuenta.setStroke('#000000', 10);

        // Lista de pasos (Cambiamos el orden lógico a 3, 2, 1, ¡YA! para emparejar con tu audio)
        const numeros = ['2', '3', '¡YA!'];
        let indice = 0;

        const ejecutarPaso = () => {
            textoCuenta.setScale(0);

            // --- ANIMACIÓN RETMICA EN LAS PISTOLAS ---
            // Hacemos que ambas pistolas den un pequeño "salto" de escala coordinado con el pulso
            this.tweens.add({
                targets: [this.p1.visual, this.p2.visual],
                scaleX: this.p1.visual.scaleX * 1.3, // Escala un 30% más grande
                scaleY: this.p1.visual.scaleY * 1.3,
                angle: (targets) => {
                    // La pistola izquierda rota un poco a la izquierda, la derecha a la derecha
                    return targets === this.p1.visual ? -15 : 15;
                },
                duration: 150,
                yoyo: true,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    // Al volver a su estado base, restauramos su escala original (0.4)
                    this.p1.visual.setScale(0.4);
                    this.p2.visual.setScale(0.4);
                    // Mantenemos el flipX correcto de la P1
                    this.p1.visual.flipX = true; 
                }
            });

            // --- ANIMACIÓN DEL TEXTO EN PANTALLA ---
            this.tweens.add({
                targets: textoCuenta,
                scale: 1.4,
                duration: 150,
                yoyo: true,
                hold: 450, // Tiempo que se queda el número arriba esperando el siguiente beat
                ease: 'Back.easeOut',
                onComplete: () => {
                    if (indice < numeros.length) {
                        textoCuenta.setText(numeros[indice]);
                       
                        if (numeros[indice] === '¡YA!') {
                            // Si tienes el audio de voz descomentado, se activará aquí
                             this.musica.play()
                            
                            this.permitirDisparo = true;
                            
                            // Efecto explosivo especial en las pistolas cuando dice ¡YA!
                            this.cameras.main.flash(400, 250, 250, 250, 0.2); // Destello blanco sutil
                        }
                        
                        indice++;
                        ejecutarPaso(); // Siguiente pulso
                    } else {
                        textoCuenta.destroy();
                    }
                }
            });
        };

        // Arranca el primer pulso (el '3' inicial)
        ejecutarPaso();
    }


    IA() {
        this.timerIA = this.time.addEvent({
            delay: 2000, 
            loop: true,
            callback: () => {
               if (this.fin || !this.permitirDisparo || this.pensandoIA) {
                    return;
               } else {
                    this.IA1()
               }
            },
            callbackScope: this
        });
    }
    
    IA1(){
        let k = Phaser.Math.Between(0,100)
        if(this.precisionIA < 0.2 && k < 10){
            this.disparoLocura();
        } else 
            this.disparoCertero()
    }
    
    disparoCertero() {
        this.timerIA.paused = true
        this.pensandoIA = true;
        this.disparaIA(); 

        const observarAngulo = () => {
            if (this.fin || !this.pensandoIA) {
                this.events.off('update', observarAngulo);
                return;
            }
            
            const dx = this.p1.body.position.x - this.p2.body.position.x;
            const dy = this.p1.body.position.y - this.p2.body.position.y;
            const anguloObjetivo = Math.atan2(dy, dx);
            let anguloActual = this.p2.body.angle;
            let diferencia = Phaser.Math.Angle.Wrap(anguloObjetivo - anguloActual);
            let diferenciaAbs = Math.abs(diferencia);
          
            if (Math.abs(diferenciaAbs) < this.precisionIA) { 
                this.disparaIA(); 
                this.pensandoIA = false; 
                this.timerIA.paused = false;
                this.events.off('update', observarAngulo);
            }
        };

        this.events.on('update', observarAngulo);
        
        if(Math.abs(this.p2.body.angularVelocity) < 0.01){
            if(this.pensandoIA) {
                this.pensandoIA = false;
                this.timerIA.paused = false;
                this.events.off('update', observarAngulo);
            }
        }
    }
    
    disparoLocura(){
        this.pensandoIA = true
        let a = Phaser.Math.Between(3,7)
        let t = 0;
    
        for(let i = 0; i < a;i++ ){
            let z = Phaser.Math.Between(4,10)*100 
            this.time.delayedCall(t+z,()=>{
                 this.disparaIA()
                 if(i===(a-1))
                    this.pensandoIA = false
            });
        }
    }
    
    disparaIA(){
         if (this.fin || !this.permitirDisparo) 
            return;
            
        this.disparar(this.p2, this.grupoP2);
        this.punto2.humo.start();
        this.time.delayedCall(300, () => this.punto2.humo.stop());
    }
    
    reproducirSonidoCarga() {
    // Verificamos que el contexto de audio de Phaser esté disponible
    const ctx = this.sound.context;
    if (!ctx) return;

    // 1. Creamos el oscilador (el generador de onda)
    const osc = ctx.createOscillator();
    // Usamos onda de sierra (sawtooth) o cuadrada (square) para que suene más agresivo y retro
    osc.type = 'sawtooth'; 

    // 2. Creamos el control de volumen (GainNode)
    const gainNode = ctx.createGain();

    // Conectamos los nodos: Oscilador -> Volumen -> Altavoces del juego
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const tiempoActual = ctx.currentTime;
    const duracion = 0.5; // Duración en segundos (coincide con tu animación)

    // 3. Configurar la FRECUENCIA (El tono que anuncia peligro)
    // Empieza en una nota baja de advertencia (150Hz) y sube exponencialmente a un pitido agudo de peligro (1200Hz)
    osc.frequency.setValueAtTime(150, tiempoActual);
    osc.frequency.exponentialRampToValueAtTime(1200, tiempoActual + duracion);

    // 4. Configurar el VOLUMEN (Fade out rápido al final)
    gainNode.gain.setValueAtTime(0.3, tiempoActual); // Volumen inicial
    gainNode.gain.exponentialRampToValueAtTime(0.01, tiempoActual + duracion); // Baja a cero al final

    // 5. Encender y apagar el sintetizador
    osc.start(tiempoActual);
    osc.stop(tiempoActual + duracion);
    }

}
