import dgram from "node:dgram";
import { Buffer } from "node:buffer";
import { AddressInfo } from "node:net";

class Server {
  address: AddressInfo | null;
  server: dgram.Socket;
  listeningPort: number;

  constructor() {
    this.address = null;
    this.server = dgram.createSocket("udp4");
    this.listeningPort = 8889;

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

      // Respond back to client after 3 seconds
      setTimeout(() => {
        new Client(rinfo.address, rinfo.port).respondOk();
      }, 3000);
    });

    /**
     * Server listens on port
     */
    this.server.bind(this.listeningPort);
  }
}

class Client {
  message: Buffer;
  client: dgram.Socket;
  address: string;
  sendPort: number;

  constructor(address: string, port: number) {
    this.message = Buffer.from("ok");
    this.client = dgram.createSocket("udp4");
    this.address = address;
    this.sendPort = port;
  }

  /**
   * Send a reply back to address and port
   */
  respondOk() {
    this.client.send(this.message, this.sendPort, this.address, (err) => {
      this.client.close();
    });
  }
}

const server = new Server();
