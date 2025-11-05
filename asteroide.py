# -*- coding: utf-8 -*-
"""
Created on Mon May 24 10:07:02 2021

@author: Administrador
"""

import pygame

class Asteroide():
    def __init__(self,position):
        try:
            self.sheet = pygame.image.load("img/14.png")
            self.image = self.sheet.subsurface(self.sheet.get_clip())
        except:
            # Crear asteroide simple si no existe
            self.sheet = pygame.Surface((60, 60))
            self.sheet.set_colorkey((0, 0, 0))  # Hacer negro transparente
            pygame.draw.circle(self.sheet, (150, 150, 150), (30, 30), 30)
            pygame.draw.circle(self.sheet, (100, 100, 100), (25, 25), 10)
            pygame.draw.circle(self.sheet, (100, 100, 100), (40, 35), 8)
            self.image = self.sheet
        self.rect = self.image.get_rect()
        self.rect.topleft = position
        self.grados = 0
        
    def rotar(self):
        rotar = pygame.transform.rotate(self.sheet,self.grados)
        rect = rotar.get_rect()
        self.rect.center = rect.center
        self.grados += 5
        if self.grados > 360:
            self.grados = 0