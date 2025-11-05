# -*- coding: utf-8 -*-
"""
Created on Mon May 24 09:26:47 2021

@author: Administrador
"""

import pygame

class Nave():
    def __init__(self,position):
        #declaramos la imagen
        try:
            self.sheet = pygame.image.load("img/navealien.png")
            self.image = self.sheet.subsurface(self.sheet.get_clip())
        except:
            # Crear imagen simple si no existe
            self.sheet = pygame.Surface((50, 30))
            self.sheet.fill((0, 255, 0))
            pygame.draw.polygon(self.sheet, (0, 200, 0), [(25, 0), (0, 30), (25, 20), (50, 30)])
            self.image = self.sheet
        #conocemos el rectangulo que formara la imagen
        self.rect = self.image.get_rect()
        self.rect.topleft = position
        self.ban = True
        self.respuesta = 0
        try:
            self.misil = pygame.image.load("img/16.png")
            self.misilimage = self.misil.subsurface(self.misil.get_clip())
        except:
            # Crear misil simple si no existe
            self.misil = pygame.Surface((10, 20))
            self.misil.fill((255, 255, 0))
            self.misilimage = self.misil
        self.misilrect = self.misilimage.get_rect()
        try:
            self.sheetbum = pygame.image.load("img/bum.png")
            self.bumimage = self.sheetbum.subsurface(self.sheetbum.get_clip())
        except:
            # Crear explosión simple si no existe
            self.sheetbum = pygame.Surface((50, 50))
            self.sheetbum.fill((255, 0, 0))
            pygame.draw.circle(self.sheetbum, (255, 165, 0), (25, 25), 25)
            self.bumimage = self.sheetbum
        self.bumrect = self.bumimage.get_rect()        
        
    def update(self, direccion):
        if direccion == 'left':
            self.rect.x -= 5
        if direccion == 'right':
            self.rect.x += 5
        if direccion == 'up':
            self.rect.y -= 5
        if direccion == 'down':
            self.rect.y += 5
        self.image == self.sheet.subsurface(self.sheet.get_clip())
    
    def disparar(self):
        self.respuesta = self.rect
        
    def move(self,x,y):
        self.rect.x += int(x*5)
        self.rect.y += int(y*5)
        
        
    def manejador_eventos(self,event):
        if event.type == pygame.KEYUP:
            if event.key == pygame.K_SPACE:
                self.ban = False
                self.respuesta = 0
        if event.type == pygame.JOYBUTTONDOWN:
                self.ban = True
                self.disparar()
        if event.type == pygame.JOYBUTTONUP:
                self.ban = False
                self.respuesta = 0
        
        
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_LEFT:
                self.update('left')
            if event.key == pygame.K_RIGHT:
                self.update('right')
            if event.key == pygame.K_UP:
                self.update('up')
            if event.key == pygame.K_DOWN:
                self.update('down')
            if event.key == pygame.K_SPACE:
                self.ban = True
                self.disparar()
        return (self.respuesta)         