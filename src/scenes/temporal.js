Cómo solucionarlo correctamente
​Para que no tengas que poner 100 o -100 manualmente, usa la propiedad mirarIzquierda que ya definiste en el objeto pistola al crearlo.
​Modifica tu función actualizarHumo dentro del create (o donde la tengas declarada) así:



const actualizarHumo = (pistola, punto) => {
    // Verificamos que la pistola exista
    if (!pistola || !pistola.body) return;

    // Usamos el booleano 'mirarIzquierda' de la propia pistola
    // Si mira a la izquierda, el offset es -100, si no, es 100
    const offset = pistola.mirarIzquierda ? -100 : 100;

    let matrix = pistola.visual.getWorldTransformMatrix();
    
    // Aplicamos el offset dinámico
    let posGlobal = matrix.transformPoint(offset, -30);
    
    punto.setPosition(posGlobal.x, posGlobal.y);
}



¿Por qué esto debería funcionar ahora?
​Independencia: Al pasarle el objeto pistola (ya sea this.p1 o this.p2), la función consulta su propiedad interna mirarIzquierda.
​Lógica binaria: La línea const offset = pistola.mirarIzquierda ? -100 : 100; es un operador ternario que actúa como un "si/entonces" inteligente: "Si mirarIzquierda es verdadero, usa -100; de lo contrario, usa 100".
​Aplicación: Al inyectar esa variable offset en el transformPoint, cada pistola "sabe" dónde debe marcar su propio humo sin que tú tengas que cambiar el código manualmente.
​Un consejo de depuración
​Si aun así ves que el punto no aparece donde debe, añade un console.log justo antes de punto.setPosition:


console.log(`Pistola: ${pistola.mirarIzquierda ? 'Izquierda' : 'Derecha'}, Offset calculado: ${offset}`);



Esto te confirmará en la consola del navegador si el código está detectando correctamente qué pistola es cuál. ¿Te sale algún error específico en la consola al intentar esta implementación?