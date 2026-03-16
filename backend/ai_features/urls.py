from django.urls import path
from . import views

urlpatterns = [
    path('ai/rewrite/', views.rewrite_text, name='rewrite_text'),
    path('ai/grammar/', views.fix_grammar, name='fix_grammar'),
    path('ai/enhance-complaint/', views.enhance_complaint, name='enhance_complaint'),
    path('ai/generate-notice/', views.generate_notice, name='generate_notice'),
] 