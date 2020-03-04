"use strict";
import cors from "cors";
import express from "express";
import { json } from "body-parser";

import { getCurrentVersion } from "./modules"; // utils
import { getBlockchain, mineBlock } from "./modules"; // blockchain
import { getSockets, connectToPeers, initP2PServer } from "./modules"; // network
import { getPublicFromWallet, initWallet } from "./modules"; // wallet

const http_port = process.env.HTTP_PORT || 3001;
const initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];

function initHttpServer() {
    const app = express();
    app.use(cors());
    app.use(json());

    app.get("/blocks", function (req, res) {
        res.send(getBlockchain());
    });
    app.get('/block/:number', function (req, res) {
        const targetBlock = getBlockchain().find(function (block) {
            return block.header.index == req.params.number;
        });
        res.send(targetBlock);
    });
    app.post("/mineBlock", function (req, res) {
        const data = req.body.data || [];
        const newBlock = mineBlock(data);
        if (newBlock === null) {
            res.status(400).send('Bad Request');
        }
        else {
            res.send(newBlock);
        }
    });
    app.get("/version", function (req, res) {
        res.send(getCurrentVersion());
    });
    app.get("/blockVersion/:number", function (req, res) {
        const targetBlock = getBlockchain().find(function (block) {
            return block.header.index == req.params.number;
        });
        res.send(targetBlock.header.version);
    });
    app.get("/peers", function (req, res) {
        res.send(getSockets().map(function (s) {
            return s._socket.remoteAddress + ':' + s._socket.remotePort;
        }));
    });
    app.post("/addPeers", function (req, res) {
        const peers = req.body.peers || [];
        connectToPeers(peers);
        res.send();
    });
    app.get("/address", function (req, res) {
        const address = getPublicFromWallet().toString();
        res.send({ "address": address });
    });
    app.post("/stop", function (req, res) {
        res.send({ "msg": "Stopping server" });
        process.exit();
    });

    app.listen(http_port, function () { console.log("Listening http port on: " + http_port) });
}

// main
connectToPeers(initialPeers);
initHttpServer();
initP2PServer();
initWallet();
