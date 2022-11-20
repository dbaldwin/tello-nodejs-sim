import dgram from "node:dgram";
import { Buffer } from "node:buffer";
import { AddressInfo } from "node:net";

class Server {
  address: AddressInfo | null;
  server: dgram.Socket;
  listeningPort: number;
  batteryPercentage: number;

  constructor() {
    this.address = null;
    this.server = dgram.createSocket("udp4");
    this.listeningPort = 8889;
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
    });

    /**
     * Server receives message
     */
    this.server.on("message", (msg, rinfo) => {
      console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);

      let response = "ok";

      if (msg.includes("battery?")) {
        response = this.batteryPercentage.toString();
        this.batteryPercentage--;
      }

      // Respond back to client after 3 seconds
      setTimeout(() => {
        new Client(rinfo.address, rinfo.port).respond(response);
      }, 3000);
    });

    /**
     * Server listens on port
     */
    this.server.bind(this.listeningPort);
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

const server = new Server();
