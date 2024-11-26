;(() => {
  const STORAGE_KEY = 'lucca_faces_data_v1'
  let people = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  let currentImageHash = ''
  let retryAttempts = 0
  let discoveredNew = 0
  const MAX_RETRY_ATTEMPTS = 5
  let questionsAnswered = 0 // Compteur de questions répondues
  let currentTotalScore = 0 // Score total actuel
  let accumulatedDifference = 0 // Écart accumulé
  let scriptRestart = 0

  // Demander le délai entre chaque question à l'utilisateur
  function approxValue(x) {
    const xData = [1000000, 1670, 1550, 1500, 1360, 1205, 1135, 1075, 1025, 975, 940, 900, 870, 835, 805, 640, 555, 500, 450, 400, 350, 300, 250, 200, 150, 100, 50, 0]
    const yData = [0, 0, 40, 60, 200, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000]

    if (x >= xData[0]) {
      return yData[0]
    } else if (x <= xData[xData.length - 1]) {
      return yData[yData.length - 1]
    } else {
      for (let i = 1; i < xData.length; i++) {
        if (x <= xData[i - 1] && x >= xData[i]) {
          const x0 = xData[i]
          const x1 = xData[i - 1]
          const y0 = yData[i]
          const y1 = yData[i - 1]
          return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
        }
      }
    }
    return null // Au cas où x ne serait pas dans la plage des données
  }

  let scorecible = parseInt(prompt('Please enter your goal score:'), 10)
  if (scorecible > 1550) {
    alert(
      '⚠️ WARNING ⚠️ A score above 1550 is not recommended. Lucca may ban people who score too high. This program can give you a score of 1670, but Lucca might ban you if your score exceeds 1550 or 1600. With this program, there is a margin of error of 20 points, so you could end up with a score of 1560 or 1570, which might lead to a ban. Please be cautious.'
    )
    // ask the user to confirm that he is aware of the risks
    const confirmation = confirm('You could be banned for 1 month from lucca face if you score too high. Are you sure you want to continue?')
    if (!confirmation) {
      console.log('User canceled the operation.')
      return
    }
  }

  function getTotalPointsFromHeaderText(headerText) {
    const regex = /(\d+) pts/
    const match = headerText.match(regex)
    if (match && match.length > 1) {
      return parseInt(match[1], 10)
    }
    return 0
  }

  function getPointsFromSpanText(spanText) {
    const regex = /\+ (\d+) pts/
    const match = spanText.match(regex)
    if (match && match.length > 1) {
      return parseInt(match[1], 10)
    }
    return 0
  }

  function getImageHash(imageSrc) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'Anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0, img.width, img.height)
        canvas.toBlob((blob) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            crypto.subtle.digest('SHA-256', reader.result).then((hashBuffer) => {
              const hashArray = Array.from(new Uint8Array(hashBuffer))
              const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
              resolve(hashHex)
            })
          }
          reader.onerror = reject
          reader.readAsArrayBuffer(blob)
        })
      }
      img.onerror = () => {
        reject('Image load error')
      }
      img.src = imageSrc
    })
  }

  function gameCompleted() {
    console.log('')
    if (discoveredNew === 0) {
      if (accumulatedDifference === 0) {
        console.log(`Game completed. Total score achieved: ${currentTotalScore}, perfect score! 🚀`)
      } else {
        console.log(`Game completed. Total score achieved: ${currentTotalScore}, with a difference of ${accumulatedDifference}pts.`)
      }
    } else {
      console.log(`During this party you have discovered ${discoveredNew} new people!`)
      console.log(`Until there is new person to discover, you can't reach the score of ${scorecible}pts`)
      console.log(`Start a new game to reach the score of ${scorecible}pts ...`)
      restartGame()
    }
    console.log('')
  }

  function handleNewImage(imageSrc) {
    getImageHash(imageSrc)
      .then((hashHex) => {
        if (hashHex !== currentImageHash) {
          currentImageHash = hashHex
          if (people[currentImageHash]) {
            ensureChoicesLoaded()
              .then((choices) => {
                const correctAnswer = [...choices].find((choice) => choice.textContent.trim() === people[currentImageHash].trim())
                if (correctAnswer) {
                  setTimeout(() => {
                    correctAnswer.click()
                    // Polling pour observer les changements dans l'élément qui affiche le score gagné
                    pollForScoreElement((pointsEarned) => {
                      questionsAnswered++
                      currentTotalScore += pointsEarned // Ajouter le score actuel au score total

                      // Calcul du score total visé
                      const totalTargetScore = scorecible

                      // Estimer le nombre de questions restantes
                      const questionsRemaining = 10 - questionsAnswered

                      // Calculer l'écart accumulé
                      accumulatedDifference = totalTargetScore - currentTotalScore

                      // Calculer le score visé pour la prochaine question
                      const scoreNeededForNextQuestion = questionsRemaining > 0 ? Math.ceil(accumulatedDifference / questionsRemaining) : 0

                      // Calculer le nouveau délai en utilisant approxValue
                      const scoreForApproxValue = scoreNeededForNextQuestion * 10 // Score total pour 10 questions
                      const newDelay = approxValue(scoreForApproxValue)

                      console.log(`${questionsAnswered}/10: ${people[currentImageHash]}, for ${pointsEarned}pts. Total : ${currentTotalScore}`)
                      if (timePerQuestion != newDelay && questionsAnswered < 10 && discoveredNew === 0) {
                        console.log('   --> ADAPTING! Requested points for next question:', scoreNeededForNextQuestion)
                        if ((scoreNeededForNextQuestion - scorecible / 10).toFixed(0) === 0) {
                          console.log(
                            `   --> Delay for next question is now: ${newDelay.toFixed(1)}ms to get ${(scoreNeededForNextQuestion - scorecible / 10).toFixed(0)} more pts !`
                          )
                        } else {
                          console.log(
                            `   --> Delay for next question is now: ${newDelay.toFixed(1)}ms to get ${(scoreNeededForNextQuestion - scorecible / 10).toFixed(1)} more pts !`
                          )
                        }
                        timePerQuestion = newDelay
                      }

                      if (questionsAnswered < 10) {
                        setTimeout(() => {
                          const newImageElement = document.querySelector('#game app-timer .image')
                          if (newImageElement) {
                            const newImageSrc = newImageElement.style.backgroundImage.match(/url\("(.*)"\)/)[1]
                            handleNewImage(newImageSrc)
                          }
                        }, newDelay) // Utiliser le nouveau délai ici
                      } else {
                        gameCompleted()
                      }
                    })
                  }, timePerQuestion)
                } else {
                  console.error('Correct answer element not found.')
                  chooseRandomAnswer()
                }
              })
              .catch(() => {
                console.error('No choices available to click.')
              })
          } else {
            discoveredNew++
            chooseRandomAnswer()
          }
        }
        retryAttempts = 0
      })
      .catch((error) => {
        if (questionsAnswered < 10) {
          // Éviter d'entrer dans ce bloc si le jeu est terminé
          console.error('Error processing image:', error)
          retryAttempts++
          if (retryAttempts <= MAX_RETRY_ATTEMPTS) {
            console.log(`Retrying (${retryAttempts}/${MAX_RETRY_ATTEMPTS})...`)
            retryHandleImage(imageSrc)
          } else {
            console.log('Max retry attempts reached. Skipping image.')
            retryAttempts = 0
            clickGoButton()
          }
        }
      })
  }
  function pollForScoreElement(callback) {
    const interval = setInterval(() => {
      const imageOverlayElement = document.querySelector('.image-container .image-overlay span.score')
      if (imageOverlayElement) {
        clearInterval(interval)
        const pointsEarned = getPointsFromSpanText(imageOverlayElement.textContent)
        const currentTotalScore = getTotalPointsFromHeaderText(document.querySelector('.score-header .score').textContent)
        callback(pointsEarned, currentTotalScore)
      }
    }, 100)
  }

  function retryHandleImage(imageSrc) {
    setTimeout(() => handleNewImage(imageSrc), 100)
  }

  function chooseRandomAnswer() {
    ensureChoicesLoaded()
      .then((choices) => {
        const randomChoice = choices[Math.floor(Math.random() * choices.length)]
        // random time between 0.5 and 1.5 seconds before clicking the random choice
        const randomTime = Math.floor(Math.random() * 1000) + 500
        setTimeout(() => randomChoice.click(), randomTime)
        setTimeout(() => {
          const correctAnswer = document.querySelector('#game .answers .is-right')
          if (correctAnswer) {
            const name = correctAnswer.textContent.trim()
            people[currentImageHash] = name
            localStorage.setItem(STORAGE_KEY, JSON.stringify(people))
            questionsAnswered++

            console.log(` NEW PERSON --> Discovered ${name} for hash ${currentImageHash}`)
          } else {
            console.error('Failed to discover the correct answer!')
          }
          if (questionsAnswered === 10) gameCompleted()
        }, 500 + randomTime)
      })
      .catch(() => {
        console.error('No choices available to click.')
      })
  }

  function ensureChoicesLoaded(retries = 5, delay = 100) {
    return new Promise((resolve, reject) => {
      const checkChoices = (attemptsLeft) => {
        const choices = document.querySelectorAll('#game .answers .answer')
        if (choices.length > 0) {
          resolve(choices)
        } else if (attemptsLeft > 0) {
          setTimeout(() => checkChoices(attemptsLeft - 1), delay)
        } else {
          reject('Choices did not load in time')
        }
      }
      checkChoices(retries)
    })
  }

  function startGame() {
    const startButtonContainer = document.querySelector('.main-container.has-loaded .logo .rotation-loader')
    if (startButtonContainer) {
      startButtonContainer.click()
      console.clear()

      console.log(`
      ██╗ ██████╗
      ██║██╔═══██╗
      ██║██║   ██║
 ██   ██║██║   ██║
 ╚█████╔╝╚██████╔╝
  ╚════╝  ╚═════╝
    `)
      console.log('')

      if (scriptRestart > 0) {
        console.log('People not known in last play, script has been restarted.')
        console.log('Script restart count:', scriptRestart)
      }
      console.log('Known people:', Object.keys(people).length)
      console.log('Target score:', scorecible)

      timePerQuestion = approxValue(scorecible)

      if (timePerQuestion === null) {
        console.error('Score cible invalide. Veuillez entrer un score cible entre 555 et 1670.')
        return
      }

      console.log(`Initial calculated delay : ${timePerQuestion.toFixed(1)} ms for ~${(scorecible / 10).toFixed(0)}pts per question`)
      console.log('')
    } else {
      if (window.location.pathname !== '/faces/game') {
        console.error('You are not on the game page. Make sure you are on /faces/game')
        return
      }
      console.error('Start button not found. Make sure the game is loaded and you see the Go button.')
    }
  }

  function restartGame() {
    const replayButton = document.querySelector('.button.mod-pill.palette-secondary.mod-XL')
    // wait a random time between 0 and 2 seconds before clicking the replay button
    console.log('Restarting the game...')
    const randomTime = Math.floor(Math.random() * 2000) + 500
    setTimeout(() => {
      if (replayButton) {
        replayButton.click()
        // wait a random time between 0.5 and 2 seconds before pasting the script again
        const randomTime = Math.floor(Math.random() * 2500) + 1000
        setTimeout(() => {
          people = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
          currentImageHash = ''
          retryAttempts = 0
          discoveredNew = 0
          questionsAnswered = 0 // Compteur de questions répondues
          currentTotalScore = 0 // Score total actuel
          accumulatedDifference = 0 // Écart accumulé
          scriptRestart++
          console.clear()
          main()
        }, randomTime)
      } else {
        // wait a random time between 0.5 and 2 seconds before pasting the script again
        const randomTime = Math.floor(Math.random() * 1500) + 500
        console.log('Restart button not found. Trying again in', randomTime, 'ms')
        setTimeout(() => {
          restartGame()
        }, randomTime)
      }
    }, randomTime)
  }

  function observeGame() {
    const gameElement = document.querySelector('#game')
    if (!gameElement) {
      return
    }
    const observer = new MutationObserver(() => {
      const imageElement = document.querySelector('#game app-timer .image')
      if (imageElement) {
        const imageSrc = imageElement.style.backgroundImage.match(/url\("(.*)"\)/)[1]
        handleNewImage(imageSrc)
      }
    })
    observer.observe(gameElement, { childList: true, subtree: true })
  }

  function main() {
    startGame()
    observeGame()
  }
  main()
})()
