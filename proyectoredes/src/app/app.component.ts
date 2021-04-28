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

  // Identificación y TTL generados Aleatoriamente
  identificacionNum = generarNumeroAleatorio(0, 65535);
  identificacion = agregarCeros(this.identificacionNum.toString(2), 16);
  identificacionHexa = convertirBinarioHexa(this.identificacion);
  tiempoDeVidaNum = generarNumeroAleatorio(0, 255);
  tiempoDeVida = agregarCeros(this.tiempoDeVidaNum.toString(2), 8);

  // Datos Ingresados
  MTU: number = 1500;
  longitudTotal: number = 0;
  protocoloNum: String = "";
  ipOrigen = "";
  ipDestino = "";

  generarDatagrama(longitudTotal: number, ipOrigen1: number, ipOrigen2: number, ipOrigen3: number, ipOrigen4: number,
    ipDestino1: number, ipDestino2: number, ipDestino3: number, ipDestino4: number) {

    this.ipOrigen = agregarCeros(ipOrigen1.toString(2), 8) + agregarCeros(ipOrigen2.toString(2), 8) +
      agregarCeros(ipOrigen3.toString(2), 8) + agregarCeros(ipOrigen4.toString(2), 8);

    this.ipDestino = agregarCeros(ipDestino1.toString(2), 8) + agregarCeros(ipDestino2.toString(2), 8) +
      agregarCeros(ipDestino3.toString(2), 8) + agregarCeros(ipDestino4.toString(2), 8);

    // Array de Datagramas, si existen más de 1
    let resultado = fragmentarDataGrama(this.MTU, this.version, this.longitudEncabezado, longitudTotal, this.serviciosDiferenciados,
      "1111100111011100", "01000000", this.protocoloNum, this.ipOrigen, this.ipDestino);

    console.log(resultado);
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