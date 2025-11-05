# -*- coding: utf-8 -*-
"""
Created on Mon May 24 07:47:49 2021

@author: Administrador
"""


import pygame
import sys
import random
import nave
import asteroide
import xbox360_controller


def reiniciar_juego(pantalla_y, pantalla_x, cantidad):
    """Función para reiniciar el juego"""
    objnave = nave.Nave((0, pantalla_y//2-25))
    arrgobj = []
    for x in range(cantidad):
        objasteroide = asteroide.Asteroide((pantalla_x-80,random.randint(1,300)))
        arrgobj.append(objasteroide)
    return objnave, arrgobj

if __name__ == "__main__":

    pygame.init()
    pantalla_x = 600
    pantalla_y = 400
    clock = pygame.time.Clock()
    fps = 15
    size = (pantalla_x,pantalla_y)
    screen = pygame.display.set_mode(size)
    pygame.display.set_caption('Mi segundo juego')
    color_rojo = (255,0,0)
    color_verde = (0,255,0)
    color_azul = (0,0,255)
    color_blanco = (255,255,255)
    color_negro = (0,0,0)
    color_gris = (128,128,128)
    grados = 0
    try:
        background = pygame.image.load("img/espacio.jpg")
    except:
        # Crear fondo simple si no existe
        background = pygame.Surface((pantalla_x, pantalla_y))
        background.fill(color_negro)
        # Agregar algunas estrellas
        for _ in range(50):
            x = random.randint(0, pantalla_x)
            y = random.randint(0, pantalla_y)
            pygame.draw.circle(background, color_blanco, (x, y), 1)
    objnave = nave.Nave((0, pantalla_y//2-25))
    #objasteroide = asteroide.Asteroide((pantalla_x-80,random.randint(1,300)))
    cantidad = 5
    ban = False
    arrgobj = []
    vidas = 3
    puntos = 0
    #controller = xbox360_controller.Controller()
    font = pygame.font.Font(None,30)
    font_boton = pygame.font.Font(None,24)
    screen_rect = screen.get_rect()
    
    for x in range(cantidad):
        objasteroide = asteroide.Asteroide((pantalla_x-80,random.randint(1,300)))
        arrgobj.append(objasteroide)
        
        
    rectangulo = 0  # Inicializar rectangulo
    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            
            if vidas > 0:
                rectangulo = objnave.manejador_eventos(event)
                #left_x, left_y = controller.get_left_stick()
                #objnave.move(left_x,left_y)
            else:
                rectangulo = 0  # No procesar eventos de nave cuando está en Game Over
                # Manejar clic del mouse cuando está en Game Over
                if event.type == pygame.MOUSEBUTTONDOWN:
                    mouse_pos = pygame.mouse.get_pos()
                    # Verificar si se hizo clic en el botón
                    boton_rect = pygame.Rect(pantalla_x//2 - 100, pantalla_y//2 + 30, 200, 40)
                    if boton_rect.collidepoint(mouse_pos):
                        # Reiniciar juego
                        vidas = 3
                        puntos = 0
                        fps = 15
                        ban = False
                        grados = 0
                        objnave, arrgobj = reiniciar_juego(pantalla_y, pantalla_x, cantidad)
                        objnave.misilrect.x = pantalla_x + 100  # Reiniciar posición del misil
            
        screen.blit(background,[0,0])
        if vidas > 0:
            texto_marcador = font.render("Vidas: " + str(vidas) + " Puntos: "+str(puntos),True,color_blanco)
            texto_marcador_rect = texto_marcador.get_rect()
            texto_marcador_rect.center = screen_rect.center
            text_x = texto_marcador_rect[0]
            screen.blit(texto_marcador,[text_x,0,176,21])
            #print(rectangulo)
            for x in arrgobj:
                rotar = pygame.transform.rotate(x.image,grados)
                screen.blit(rotar,x.rect)
                grados += 1
                x.rect.x -= 5
                if x.rect.x < 0:
                    x.rect.x =  pantalla_x - 80
                    x.rect.y =  random.randint(1,300)
                if grados > 360:
                   grados = 0
            for x in arrgobj:
                if objnave.rect.colliderect(x.rect):
                    x.rect.x -= pantalla_x - 80
                    screen.blit(objnave.bumimage,objnave.rect)
                    vidas -= 1
            if ban:
                screen.blit(objnave.misilimage,objnave.misilrect)
                objnave.misilrect.x += 10
                for x in arrgobj:
                    if objnave.misilrect.colliderect(x.rect):
                        arrgobj.remove(x)
                        objnave.misilrect.x = pantalla_x + 100
                        puntos += 5
                        obj = asteroide.Asteroide((pantalla_x-80,random.randint(1,300)))
                        arrgobj.append(obj)
                        fps += 1
            if rectangulo != 0:
                objnave.misilrect.center = rectangulo.center
                ban = True
        else:
            # Pantalla Game Over
            texto_final = font.render("Game Over Puntos "+str(puntos),True,color_blanco)
            texto_final_rect = texto_final.get_rect()
            texto_final_rect.center = (screen_rect.centerx, screen_rect.centery - 30)
            screen.blit(texto_final,texto_final_rect)
            
            # Crear botón "Volver a jugar"
            boton_rect = pygame.Rect(pantalla_x//2 - 100, pantalla_y//2 + 30, 200, 40)
            mouse_pos = pygame.mouse.get_pos()
            
            # Cambiar color del botón si el mouse está sobre él
            if boton_rect.collidepoint(mouse_pos):
                boton_color = color_verde
            else:
                boton_color = color_gris
            
            # Dibujar botón
            pygame.draw.rect(screen, boton_color, boton_rect)
            pygame.draw.rect(screen, color_blanco, boton_rect, 2)
            
            # Texto del botón
            texto_boton = font_boton.render("Volver a jugar", True, color_blanco)
            texto_boton_rect = texto_boton.get_rect()
            texto_boton_rect.center = boton_rect.center
            screen.blit(texto_boton, texto_boton_rect)
            
        if vidas > 0:
            screen.blit(objnave.image,objnave.rect)
    
    
        pygame.display.flip()
        clock.tick(fps)
        