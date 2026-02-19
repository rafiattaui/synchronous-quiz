"use client"

import React, { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"

interface Question {
    questionId: string;
    question: string;
    options: string[];
}

export default function Lobby() {
  const [roomCode, setRoomCode] = useState("")
  const [roomStatus, setRoomStatus] = useState("")
  const [error, setError] = useState("")
  const [players, setPlayers] = useState<string[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [phaseEndsAt, setPhaseEndsAt] = useState<number | null>(null)
  const socket = useRef<Socket | null>(null)

  useEffect(() => {
    socket.current = io("ws://localhost:3001")
    socket.current.on("connect", () => {
      console.log("Socket connected")
    })
  }, []);

  return (
    <main>
      <h1>Quiz Lobby</h1>
    </main>
  )
}