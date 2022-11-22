import dgram from "node:dgram";
import { Buffer } from "node:buffer";
import { AddressInfo } from "node:net";

class CommandServer {
  address: AddressInfo | null;
  server: dgram.Socket;
  commandPort: number;
  statePort: number;
  batteryPercentage: number;

  constructor() {
    this.address = null;
    this.server = dgram.createSocket("udp4");
    this.commandPort = 8889;
    this.statePort = 8890;
    this.batteryPercentage = 100;

    /**
     * Server error
     */
    this.server.on("error", (err) => {
      console.log(`server error:\n${err.stack}`);
      this.server.close();
    });

    /**
     * Server is up and running
     */
    this.server.on("listening", () => {
      this.address = this.server.address();

      console.log(
        `server listening ${this.address.address}:${this.address.port}`
      );

      let test = this.address.address;

      // Start sending state packets
      setInterval(() => {
        new Client(this.address!.address, this.statePort).respond(
          DroneState.getState(this.batteryPercentage)
        );
      }, 1000);
    });

    /**
     * Server receives message
     */
    this.server.on("message", (msg, rinfo) => {
      console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);

      let response = "ok";

      if (msg.includes("battery?")) {
        this.batteryPercentage = this.batteryPercentage - 1;
        response = this.batteryPercentage.toString();

        // Reset the battery
        this.batteryPercentage =
          this.batteryPercentage < 1 ? 100 : this.batteryPercentage;
      }

      // Respond back to client after 3 seconds
      setTimeout(() => {
        new Client(rinfo.address, rinfo.port).respond(response);
      }, 3000);
    });

    /**
     * Server listens on port
     */
    this.server.bind(this.commandPort);
  }
}

class Client {
  client: dgram.Socket;
  address: string;
  sendPort: number;

  constructor(address: string, port: number) {
    this.client = dgram.createSocket("udp4");
    this.address = address;
    this.sendPort = port;
  }

  /**
   * Send a reply back to address and port
   */
  respond(message: string) {
    this.client.send(
      Buffer.from(message),
      this.sendPort,
      this.address,
      (err) => {
        this.client.close();
      }
    );
  }
}

class DroneState {
  static getState(battery: number) {
    let state = `mid:${this.random(
      1,
      8
    )};x:0;y:0;z:0;mpry:0,0,0;pitch:1;roll:0;yaw:0;vgx:0;vgy:0;vgz:0;templ:66;temph:67;tof:10;h:0;bat:${battery};baro:328.69;time:0;agx:21.00;agy:15.00;agz:-1004.00;`;
    return state;
  }

  static random(start: number, end: number) {
    return Math.floor(Math.random() * end) + start;
  }
}

const commandServer = new CommandServer();
