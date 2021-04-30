import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  // Datos Estáticos
  version: String = "0101";
  longitudEncabezado = "0100";
  serviciosDiferenciados = "00000000";

  // Datos Aleatorios
  identificacion: String[] = ["Valor entre 0 y 65.535"];
  tiempoDeVida: String[] = ["Valor entre 0 y 255"];

  // Datos Ingresados
  MTU: number = 0;
  longitudTotal: number = 0;
  protocoloNum: String = "";
  ipOrigen = "";
  ipDestino = "";

  checksum = "Suma de comprobación";
  banderas: String = "";
  desplazamiento = "Desplazamiento";
  DF: String = "DF";
  MF: String = "MF";

  fragmentos: String = "Encabezado Datagrama IPv4";
  fragmentosBinarios: String = "Encabezado Datagrama IPv4";

  generarDatagrama(MTU: number, longitudTotal: number, ipOrigen1: number, ipOrigen2: number, ipOrigen3: number, ipOrigen4: number,
    ipDestino1: number, ipDestino2: number, ipDestino3: number, ipDestino4: number) {

    // Identificación y TTL generados Aleatoriamente
    let identificacionNum = generarNumeroAleatorio(0, 65535);
    let identificacion = agregarCeros(identificacionNum.toString(2), 16);
    let identificacionBinaria = identificacion;
    this.identificacion = convertirBinarioHexa(identificacion);
    let identificacionHexa = convertirBinarioHexa(identificacion);
    let tiempoDeVidaNum = generarNumeroAleatorio(0, 255);
    let tiempoDeVida = agregarCeros(tiempoDeVidaNum.toString(2), 8);
    this.tiempoDeVida = convertirBinarioHexa(tiempoDeVida);


    this.ipOrigen = agregarCeros(ipOrigen1.toString(2), 8) + agregarCeros(ipOrigen2.toString(2), 8) +
      agregarCeros(ipOrigen3.toString(2), 8) + agregarCeros(ipOrigen4.toString(2), 8);

    this.ipDestino = agregarCeros(ipDestino1.toString(2), 8) + agregarCeros(ipDestino2.toString(2), 8) +
      agregarCeros(ipDestino3.toString(2), 8) + agregarCeros(ipDestino4.toString(2), 8);

    // Array de Datagramas, si existen más de 1 Desplazamiento(Quemado)
    let resultado = fragmentarDataGrama(MTU, this.version, this.longitudEncabezado, longitudTotal, this.serviciosDiferenciados,
      identificacionBinaria, tiempoDeVida, this.protocoloNum, this.ipOrigen, this.ipDestino);

    let valores = regresarChecksum(MTU, this.version, this.longitudEncabezado, longitudTotal, this.serviciosDiferenciados,
      identificacionBinaria, tiempoDeVida, this.protocoloNum, this.ipOrigen, this.ipDestino)

    this.checksum = binHex(valores[0]);
    this.DF = valores[1].toString().substring(1,2);
    this.MF = valores[1].toString().substring(2);
    this.desplazamiento = valores[2].toString();

    let fragmento = separarBits(resultado);
    this.fragmentos = fragmento.join(' ').replace(/ /g, "\n").replace(/,/g, " ");

    let fragmentoBinario = separarBitsBinario(resultado);
    this.fragmentosBinarios = fragmentoBinario.join().replace(/;/g, "\n").replace(/,/g, " ");

  }

  radioChangeHandler(event: any) {
    this.protocoloNum = event.target.value;
  }

}

function fragmentarDataGrama(MTU, longitudEncabezado, version, longitudTotal, serviciosDiferenciados,
  identificacion, tiempoDeVida, protocolo, ipOrigen, ipDestino) {

  let datagramas = [];
  var cantidadFragmentos = Math.trunc(longitudTotal / (MTU - 20));
  var desplazamiento = 0;
  var flags = "001";

  for (let index = 0; index < cantidadFragmentos; index++) {

    var longitudTotalB = agregarCeros(MTU.toString(2), 16);
    var desplazamientoB = agregarCeros(desplazamiento.toString(2), 13);
    var datagrama = version + longitudEncabezado + serviciosDiferenciados + longitudTotalB
      + identificacion + flags + desplazamientoB
      + tiempoDeVida + protocolo + ipOrigen + ipDestino;
    var suma = obtenerSumaComprobacion(datagrama);
    datagrama = version + longitudEncabezado + serviciosDiferenciados + longitudTotalB
      + identificacion + flags + desplazamientoB
      + tiempoDeVida + protocolo + suma + ipOrigen + ipDestino;
    datagramas.push(datagrama);
    desplazamiento += (MTU - 20) / 8;

  }

  var longitudTotalB = agregarCeros((longitudTotal - (((MTU - 20) * cantidadFragmentos)) + 20).toString(2), 16);
  desplazamiento = ((MTU - 20) * cantidadFragmentos) / 8;
  desplazamientoB = agregarCeros(desplazamiento.toString(2), 13);
  var datagrama = version + longitudEncabezado + serviciosDiferenciados + longitudTotalB
    + identificacion + "000" + desplazamientoB
    + tiempoDeVida + protocolo + ipOrigen + ipDestino;
  var suma = obtenerSumaComprobacion(datagrama);
  datagrama = version + longitudEncabezado + serviciosDiferenciados + longitudTotalB
    + identificacion + flags + desplazamientoB
    + tiempoDeVida + protocolo + suma + ipOrigen + ipDestino;
  datagramas.push(datagrama);

  return datagramas;
}

function obtenerSumaComprobacion(datagrama) {
  let datagramaH = convertirBinarioHexa(datagrama);
  var reprDec = datagramaH[0] + datagramaH[1];
  var reprHex = reprDec.toString(16);

  for (let index = 2; index < datagramaH.length; index++) {

    reprDec += datagramaH[index];
    reprHex = reprDec.toString(16);

    if (reprHex.length > 4) {
      reprHex = reprHex.substring(1, reprHex.length);
      reprDec = parseInt(reprHex, 16);
      reprDec = reprDec + 1;
      reprHex = reprDec.toString(16);
    }
  }

  reprDec = parseInt(reprHex, 16);
  var resultadoNum = 65535 - reprDec;
  var resultado = resultadoNum.toString(16);
  var resultadoB = parseInt(resultado, 16).toString(2);

  return agregarCeros(resultadoB, 16);


}

function convertirBinarioHexa(binario) {
  let w16 = [];
  for (let index = 0; index < binario.length; index += 16) {
    var numero = parseInt(binario.substring(index, index + 16), 2);
    w16.push(numero);

  }
  return w16;
}

function agregarCeros(binario, longitud) {
  var resultado = "";
  var diferencia = longitud - binario.length;
  for (let index = 0; index < diferencia; index++) {
    resultado += "0";
  }

  return resultado + binario;
}

function generarNumeroAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Convierte un numero binario de 8 bits a hexadecimal
 * @param {*} Binario 
 * @returns 
 */
function binHex(Binario: any) {

  let decimalTemporal = parseInt(Binario, 2);
  let Hexadecimal = decimalTemporal.toString(16);

  return Hexadecimal;
}

/**
* Separa los bits del encabezado en tramos de 8 bits
* @param {*} arreglo 
* @returns arreglo con parejas hexadecimales
*/
function separarBits(arreglo) {

  let fragment = [];

  for (let index = 0; index < arreglo.length; index++) {

    let parejas = [];
    var fragmento = arreglo[index];
    var hexa = '';

    var pareja = '';

    for (let i = 0; i < fragmento.length; i++) {

      pareja = pareja + (fragmento[i]);

      if (pareja.length == 8) {

        hexa = binHex(pareja);

        if (hexa.length == 1) {

          hexa = '0' + hexa;
        }
        parejas.push(hexa);

        pareja = '';
      }
    }

    fragment.push(parejas);
  }

  return fragment;
}

function separarBitsBinario(arreglo: string[]) {

  let fragment = [];
  let con = 0;

  for (let index = 0; index < arreglo.length; index++) {

    let octetos = [];
    var fragmento = arreglo[index];
    var octeto = '';

    var pareja = '';

    for (let i = 0; i < fragmento.length; i++) {

      pareja = pareja + (fragmento[i]);
      con++;

      if (pareja.length == 8) {
        octeto = pareja;
        octetos.push(octeto);
        pareja = '';
      }

      if (con == 32) {
        octetos.push(";")
        con = 0;
      }
    }

    fragment.push(octetos);
    octetos.push(";");
  }

  return fragment;
}

function regresarChecksum(MTU, longitudEncabezado, version, longitudTotal, serviciosDiferenciados,
  identificacion, tiempoDeVida, protocolo, ipOrigen, ipDestino) {

  let datagramas = [];
  var cantidadFragmentos = Math.trunc(longitudTotal / (MTU - 20));
  var desplazamiento = 0;
  var flags = "001";

  for (let index = 0; index < cantidadFragmentos; index++) {

    var longitudTotalB = agregarCeros(MTU.toString(2), 16);
    var desplazamientoB = agregarCeros(desplazamiento.toString(2), 13);
    var datagrama = version + longitudEncabezado + serviciosDiferenciados + longitudTotalB
      + identificacion + flags + desplazamientoB
      + tiempoDeVida + protocolo + ipOrigen + ipDestino;
    var suma = obtenerSumaComprobacion(datagrama);
    datagrama = version + longitudEncabezado + serviciosDiferenciados + longitudTotalB
      + identificacion + flags + desplazamientoB
      + tiempoDeVida + protocolo + suma + ipOrigen + ipDestino;
    datagramas.push(datagrama);
    desplazamiento += (MTU - 20) / 8;

  }

  var longitudTotalB = agregarCeros((longitudTotal - (((MTU - 20) * cantidadFragmentos)) + 20).toString(2), 16);
  desplazamiento = ((MTU - 20) * cantidadFragmentos) / 8;
  desplazamientoB = agregarCeros(desplazamiento.toString(2), 13);
  var datagrama = version + longitudEncabezado + serviciosDiferenciados + longitudTotalB
    + identificacion + "000" + desplazamientoB
    + tiempoDeVida + protocolo + ipOrigen + ipDestino;
  var suma = obtenerSumaComprobacion(datagrama);
  datagrama = version + longitudEncabezado + serviciosDiferenciados + longitudTotalB
    + identificacion + flags + desplazamientoB
    + tiempoDeVida + protocolo + suma + ipOrigen + ipDestino;
  datagramas.push(datagrama);

  return [suma, flags, desplazamiento];
}